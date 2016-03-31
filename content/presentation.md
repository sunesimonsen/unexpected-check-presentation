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

expect(function (s) {
  expect(decodeURIComponent(encodeURIComponent(s)), 'to equal', s)
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

isSorted(sort(a)) = true

---

```js
var quicksort = require('quicksort.js');

function isSorted (array) {
  return array.every((x, i) => (
    array.slice(i).every(y => x <= y)
  ))
}
```

---

Let's make a assertion for checking that arrays are sorted:

```js
expect.addAssertion('to be sorted', function (expect, subject) {
  expect(isSorted(subject), 'to be true')
})
```

---

Quicksort sorts arrays of strings correctly

```js
var stringArrays = g.n(g.string, g.natural({ max: 10 }))

expect(function (a) {
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

expect(function (a) {
  expect(quicksort.asc(a), 'to be sorted')
}, 'to be valid for all', integerArrays)
```

---

Let's try the same with the build-in sorting function:

```js
expect(function (a) {
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

While adding and removing items, the items should always be retrieved in the
same order they where inserted.

---

```js
function Queue () {
  this.data = []
}

Queue.prototype.add = function (item) {
  this.data.push(item)
}

Queue.prototype.remove = function () {
  return this.data.shift()
}

Queue.prototype.isEmpty = function () {
  return this.data.length === 0
}
```

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
  g.natural( { max: 30 })
)
```

---

```js

```

===

## Questions

===

## The end

Stickers for everybody :-)
