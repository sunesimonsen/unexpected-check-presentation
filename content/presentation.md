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

```js
expect.use(require('unexpected-check'))
var g = require('chance-generators')(42)

var strings = g.string({ length: g.natural({ max: 50 })})

expect((string) => {
  expect(
    decodeURIComponent(encodeURIComponent(string)),
    'to equal',
    string
  )
}, 'to be valid for all', strings)
```

Note: 
* we use a seeded random as it is important that test are reproducible.
* it is tempting to just rely property based testing, but I would always
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
var quicksort = require('quicksort.js');

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
var stringArrays = g.n(g.string, g.natural({ max: 10 }))

expect((a) => {
  expect(quicksort.asc(a), 'to be sorted')
}, 'to be valid for all', stringArrays)
```

Note: notice how we are testing both the isSorted function and the sorting
function, property based testing will find bugs in your production code as wells
as in your testing code.

---

...and interger arrays:

```js
var integerArrays = g.n(
  g.integer({ min: -100, max: 100 }),
  g.natural({ max: 20 })
)

expect((a) => {
  expect(quicksort.asc(a), 'to be sorted')
}, 'to be valid for all', integerArrays)
```

---

Let's try the same with the build-in sorting function:

```js
expect((a) => {
  expect(a.sort(), 'to be sorted')
}, 'to be valid for all', integerArrays)
```

---

And it fails!

<img src="/content/wat.jpg" alt="wat">

Note: we can't even sort integers anymore, what is even happening?

---

We get the following error:

```output
Ran 47 iterations and found 20 errors
counterexample:

  Generated input: [ -58, -89 ]

  expected [ -58, -89 ] to be sorted
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
var addOperation = g.shape({
  type: 'add',
  value: g.integer
})

var removeOperation = g.shape({
  type: 'remove'
})

var operations = g.n(
  g.pick([addOperation, removeOperation]),
  g.natural({ max: 30 })
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
  var added = [], removed = []
  operations.forEach((operation) => {
    if (operation.type === 'add') {
      added.push(operation.value)
      queue.enq(operation.value)
    } else if (!queue.isEmpty()) {
      removed.push(queue.deq())
    }
  })

  return { added: added, removed: removed }
}
```

---

```js
var Queue = require('queuejs');

expect((operations) => {
  var queue = new Queue()
  var simulation = execute(queue, operations)
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
  var queue = new Queue()
  operations.forEach((operation) => {
    var currentSize = queue.size()
    if (operation.type === 'add') {
      queue.enq(operation.value)
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
var arrayEqual = require('array-equal')

function containsSubArray(array, subArray) {
  return array.some((v, i) => {
    return arrayEqual(array.slice(i, i + subArray.length), subArray)
  })
}
```

Note: can you spot the error

---

```js
var maxLength = g.natural({ max: 100 })
var arrays = g.n(g.natural({ max: 100 }), maxLength)
var offset = maxLength
var length = maxLength

expect((array, offset, length) => {
  var subArray = array.slice(offset, offset + length)
  expect(
    containsSubArray, 'when called with', [array, subArray],
    'to be true'
  )
}, 'to be valid for all', arrays, offset, length)
```

---

```output
Ran 19 iterations and found 4 errors
counterexample:

  Generated input: [], 0, 0

  expected
  function containsSubArray(array, subArray) {
    return array.some((v, i) => {
      return arrayEqual(array.slice(i, i + subArray.length), subArray);
    });
  }
  when called with [], [] to be true
    expected false to be true
```

---

The assertion find an error after 15 iterations and shrinks it to the optimal
output in 4 iterations:

```
[] 53 19
[] 45 4
[] 43 4
[] 0 0
```

---

Shrinking a number:

```js#evaluate:false
var numbers = g.integer({ min: -100, max: 100 })

numbers.shrink(22)
// will return: g.natural({ min: -100,  max: 22 }) 

numbers.shrink(-33) 
// will return: g.natural({ min: -33, max: 100 }) 
```

The generated values will converge towards zero.

---

Shrinking an array: 

```js#evaluate:false
var arrays = g.n(g.natural({ max: 100 }), g.natural({ min: 2, max: 100 }))

arrays.shrink([79, 25, 42, 94, 27])
// will return: g.pick([79, 25, 42, 94, 27], g.natural({ min: 2, max: 5 }) 
```

The generated arrays will converge towards the smallest possible array.

===

## Questions

===

## The end

Stickers for everybody :-)
