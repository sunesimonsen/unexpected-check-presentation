## The birth of unexpected-check

Map with dotted line from Copenhagen to San Fransisco

Note:
* Tell the story about how unexpected-check came to life.
** coworker speaking about property based testing
** thinking about the problem for some time
** trip to San Fransisco - crappy entertainment system

===

## Property based testing
#### -what is it all about?

---

Property based testings makes statements about a piece of code while being
exercised with data taken from a given input space.

---

Imagine we wanted to test the encodeURIComponent function.

---

### Example-based testing

```js
expect(encodeURIComponent(''), 'to equal', '')
expect(encodeURIComponent('Hello ATF'), 'to equal', 'Hello%20ATF')
expect(encodeURIComponent('100% cool!'), 'to equal', '100%25%20cool!')
expect(encodeURIComponent('~&?'), 'to equal', '~%26%3F')
```

---

### Property-based testing

decodeURIComponent(encodeURIComponent(s)) = s

---

Let's start out by generating some strings:

```js
expect.use(require('unexpected-check'))
const Generators = require('chance-generators')

let { natural, string } = new Generators(42)
let strings = string({ length: natural({ max: 50 })})
```

Note: we use a seeded random as it is important that test are reproducible.

---

```js
expect((string) => {
  expect(
    decodeURIComponent(encodeURIComponent(string)),
    'to equal',
    string
  )
}, 'to be valid for all', strings)
```

Note: it is tempting to just rely property based testing, but I would always
complement it with sanity checks.

===

## Problems that are well suited for property based testing

---

### Functions that have an inverse function

---

* reverse
* encode/decode
* add/remove

Note: many mathematical function

---

### Functions where is easier to check the result than computing it

---

* sorting
* searching
* most transformations

Note: a huge amount of problems has this characteristics

---

### Objects that maintains an invariant

---

* sets
* queues
* balanced search trees

Note:
sets - no duplicates
balanced search trees - stays balanced
queues - items are retrieved in the same order they are inserted

===

## Testing a sorting function

<img src="/content/sorting.jpg">

isSorted(sort(a)) = true

---

```js
const quicksort = require('quicksort.js');

function isSorted (array) {
  return array.every((x, i) => {
    return array.slice(i).every((y) => x <= y)
  })
}
```

---

Let's make a assertion for checking that arrays are sorted:

```js
expect.addAssertion('to be sorted', (expect, subject) => {
  expect(isSorted(subject), 'to be true')
})
```

---

Quicksort sorts arrays of strings correctly

```js
let { n, natural, string } = new Generators(42)
let stringArrays = n(string, natural({ max: 10 }))

expect((array) => {
  expect(quicksort.asc(array), 'to be sorted')
}, 'to be valid for all', stringArrays)
```

Note: notice how we are testing both the isSorted function and the sorting
function, property based testing will find bugs in your production code as wells
as in your testing code.

---

...and interger arrays:

```js
let { integer, n, natural } = new Generators(42)

let integerArrays = n(
  integer({ min: -100, max: 100 }),
  natural({ max: 20 })
)

expect((array) => {
  expect(quicksort.asc(array), 'to be sorted')
}, 'to be valid for all', integerArrays)
```

---

Let's try the same with the build-in sorting function:

```js
expect((array) => {
  expect(array.sort(), 'to be sorted')
}, 'to be valid for all', integerArrays)
```

---

And it fails!

<img src="/content/wat.jpg" alt="wat">

Note: we can't even sort integers anymore, what is even happening?

---

We get the following error:

```output
Ran 61 iterations and found 20 errors
counterexample:

  Generated input: [ -68, -77 ]

  expected [ -68, -77 ] to be sorted
```

Note: The explanation: build-in search sort alphabetically based on string conversion.

===

## Testing a queue

<img src="/content/queue.jpg">

While adding and removing items, the items should always be retrieved in the
same order they where inserted.


---

Let's generate some operations:

```js
let { integer, n, natural, pickone, shape } = new Generators(42)

const addOperation = shape({
  type: 'add',
  value: integer
})

const removeOperation = shape({
  type: 'remove'
})

const operations = n(
  pickone([addOperation, removeOperation]),
  natural({ max: 30 })
)
```

---

This will generate arrays with the following structure:

```js#evaluate:false
[
  { type: 'remove' },
  { type: 'remove' },
  { type: 'add', value: -1331529414344704 },
  { type: 'remove' },
  { type: 'remove' },
  { type: 'remove' },
  { type: 'add', value: -4654237011148800 },
  { type: 'remove' },
  { type: 'add', value: 3344884333281280 },
  { type: 'remove' },
  { type: 'add', value: 1939033726910464 }
]
```

---

```js
function execute(queue, operations) {
  const added = [], removed = []
  operations.forEach(({ type, value }) => {
    if (type === 'add') {
      added.push(value)
      queue.enq(value)
    } else if (!queue.isEmpty()) {
      removed.push(queue.deq())
    }
  })

  return { added, removed }
}
```

---

```js
const Queue = require('queuejs');

expect((operations) => {
  const queue = new Queue()
  const simulation = execute(queue, operations)
  expect(
    simulation.removed,
    'to equal',
    simulation.added.slice(0, simulation.added.length - queue.size())
  )
}, 'to be valid for all', operations)
```

---

Reuse generated operations:

```js
expect(function (operations) {
  const queue = new Queue()
  operations.forEach(({ type, value }) => {
    const currentSize = queue.size()
    if (type === 'add') {
      queue.enq(value)
      expect(queue.size(), 'to equal', currentSize + 1)
    } else if (!queue.isEmpty()) {
      queue.deq()
      expect(queue.size(), 'to equal', currentSize - 1)
    }
  })
}, 'to be valid for all', operations)
```

===

## Real world example
#### Testing menu positioning

Note: maybe a drawing

===

## Input shrinking

<img src="/content/ShrinkingSam.jpg">

---

```js
const arrayEqual = require('array-equal')

function containsSubArray(array, subArray) {
  return array.some((v, i) => (
    arrayEqual(array.slice(i, i + subArray.length), subArray)
  ))
}
```

Note: can you spot the error

---

```js
let { integer, n, natural } = new Generators(314)
const length = natural({ max: 100 })
const arrays = n(integer, length)
const offset = natural({ max: 100 })

expect((array, offset, length) => {
  const subArray = array.slice(offset, offset + length)
  expect(
    containsSubArray, 'when called with', [array, subArray],
    'to be true'
  )
}, 'to be valid for all', arrays, offset, length)
```

---

```output
Ran 77 iterations and found 6 errors
counterexample:

  Generated input: [], 0, 0

  expected
  function containsSubArray(array, subArray) {
    return array.some(function (v, i) {
      return arrayEqual(array.slice(i, i + subArray.length), subArray);
    });
  }
  when called with [], [] to be true
    expected false to be true
```

---

The assertion finds an error after 71 iterations and shrinks it to the optimal
output in 6 iterations:

```
[] 46 18
[] 27 12
[] 13 11
[] 5 0
[] 3 0
[] 0 0
```

---

Shrinking a number:

```js
let { integer } = new Generators(42)
const numbers = integer({ min: -100, max: 100 })

let shrunkenGenerator = numbers.shrink(22)
// will return: integer({ min: -100,  max: 22 }) 
expect(shrunkenGenerator(), 'to be within', -100, 22)

let shrunkenGenerator = numbers.shrink(-33) 
// will return: integer({ min: -33, max: 100 }) 
expect(shrunkenGenerator(), 'to be within', -33, 100)

```

The shrunken values will converge towards zero.

---

Shrinking an array: 

```js
let { n, natural } = new Generators(42)
const arrays = n(natural({ max: 100 }), natural({ min: 2, max: 100 }))

let shrunkenGenerator = arrays.shrink([79, 25, 42, 94, 27])
// will return: pickset([79, 25, 42, 94, 27], natural({ min: 2, max: 5 }) 

expect(shrunkenGenerator(), 'to equal', [ 94, 27, 79 ])
expect(shrunkenGenerator(), 'to equal', [ 42, 79, 94, 25 ])
expect(shrunkenGenerator(), 'to equal', [ 42, 27 ])
```

The shrunken arrays will converge towards the smallest possible array.

===

What will the future bring?

<!-- .slide: data-background="#ff0000" -->

<img src="/content/crystal-ball.jpg">

===

## Questions

===

## The end

Stickers for everybody :-)
