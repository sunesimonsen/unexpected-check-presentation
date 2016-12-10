function toArray (items) {
    return Array.prototype.slice.call(items)
}

var container = document.querySelector('article')
var slides = toArray(document.querySelectorAll('.slide'))

var notesWindow = null

var backgrounds = {}
slides.filter(function (slide) {
    return slide.hasAttribute('data-background')
}).forEach(function (slide) {
    var backgroundElement = document.createElement('div')
    var background = slide.getAttribute('data-background')

    backgroundElement.classList.add('background')
    backgroundElement.style.backgroundImage = 'url("' + background + '")'
    document.body.appendChild(backgroundElement)
    backgrounds[slide.id] = backgroundElement
})

var sections = toArray(document.querySelectorAll('.section'))

var presentation = {
    lastPosition: { section: -1, slide: -1 },

    position: {
        section: -1,
        slide: -1
    },

    sections: sections.map(function (section) {
        return toArray(section.querySelectorAll('.slide'))
    }),

    updatePosition: function (section, slide) {
        this.lastPosition = {
            section: this.position.section,
            slide: this.position.slide
        }

        if (0 <= section && section < this.sections.length) {
            this.position.section = section
            if (0 <= slide && slide < this.sections[section].length) {
                this.position.slide = slide
            }
        }
    },

    getCurrentSection: function () {
        return this.sections[this.position.section]
    },

    getSlideAtPosition: function (position) {
        var section = this.sections[position.section]
        var slide = section && section[position.slide]
        return slide || null
    },

    getLastSlide: function () {
        return this.getSlideAtPosition(this.lastPosition)
    },

    getCurrentSlide: function () {
        return this.getSlideAtPosition(this.position)
    },

    isFirstSection: function () {
        return this.position.section === 0
    },

    isLastSection: function () {
        return this.position.section === this.sections.length - 1
    },

    nextSection: function () {
        this.updatePosition(
            this.position.section + 1,
            0
        )
    },

    prevSection: function () {
        var section = this.getCurrentSection()
        this.updatePosition(
            this.position.section - 1,
            section.length - 1
        )
    },

    nextSlide: function () {
        var section = this.getCurrentSection()
        if (this.position.slide < section.length - 1) {
            this.updatePosition(
                this.position.section,
                this.position.slide + 1
            )
        } else {
            this.nextSection()
        }
    },

    prevSlide: function () {
        if (this.position.slide > 0) {
            this.updatePosition(
                this.position.section,
                this.position.slide - 1
            )
        } else {
            if (this.position.section > 0) {
                var prevSectionIndex = this.position.section - 1

                this.updatePosition(
                    prevSectionIndex,
                    this.sections[prevSectionIndex].length - 1
                )
            } else {
                this.updatePosition(
                    this.position.section,
                    this.position.slide
                )
            }
        }
    },

    leftSlide: function () {
        this.updatePosition(
            this.position.section - 1,
            0
        )
    },

    rightSlide: function () {
        this.nextSection()
    },

    upSlide: function () {
        this.updatePosition(
            this.position.section,
            this.position.slide - 1
        )
    },

    downSlide: function () {
        this.updatePosition(
            this.position.section,
            this.position.slide + 1
        )
    },

    restart: function () {
        this.updatePosition(
            0,
            0
        )
    },

    showLastSlide: function () {
        var section = this.getCurrentSection()
        this.updatePosition(
            this.sections.length - 1,
            section.length - 1
        )
    },

    getDirection: function (last, next) {
        if (last.section < next.section) {
            return 'left'
        } else if (last.section > next.section) {
            return 'right'
        } else if (last.slide < next.slide) {
            return 'up'
        } else if (last.slide > next.slide) {
            return 'down'
        } else {
            return 'none'
        }
    },

    navigate: function (operation) {
        this[operation]()

        var slide = this.getCurrentSlide()

        var hash = '#' + slide.id
        if (hash !== location.hash) {
            history.pushState(slide.id, slide.id, hash)
        }

        this.render()
    },

    renderNotes: function (slide) {
        if (notesWindow) {
            var html = toArray(slide.querySelectorAll('aside')).map(function (aside) {
                return '<p>' + aside.innerHTML + '</p>'
            }).join('\n')
            notesWindow.document.body.innerHTML = html
        }
    },

    render: function (rerender) {

        if (
            this.lastPosition.section !== this.position.section ||
            this.lastPosition.slide !== this.position.slide
        ) {
            var slide = this.getCurrentSlide()
            var lastSlide = this.getLastSlide()

            if (!rerender) {
                this.renderNotes(slide)
            }

            if (!rerender && slide.id in backgrounds) {
                backgrounds[slide.id].classList.add('visible')
            }

            if (!rerender && lastSlide) {
                var direction = this.getDirection(this.lastPosition, this.position)
                document.body.className = 'transition-' + direction

                if (lastSlide.id in backgrounds) {
                    backgrounds[lastSlide.id].classList.remove('visible')
                }

                lastSlide.classList.add('slide-out')
                setTimeout(function () {
                    lastSlide.classList.remove('slide-out')
                }, 500);
                lastSlide.setAttribute('aria-selected', 'false')
            }

            slide.classList.remove('slide-out')
            slide.setAttribute('aria-selected', 'true')
            repositionSlide(slide)
        }
    }
}

function repositionSlide(slide) {
    var slideHeight = slide.clientHeight
    var slideWidth = slide.clientWidth
    var scale = 1
    if (slideHeight > window.innerHeight && slideWidth > window.innerWidth) {
        scale = Math.min(
            window.innerWidth / slideWidth,
            window.innerHeight / slideHeight
        )
    } else if (slideHeight > window.innerHeight) {
        scale = window.innerHeight / slideHeight
    } else if (slideWidth > window.innerWidth) {
        scale = window.innerWidth / slideWidth
    }

    slide.style.top = (window.innerHeight - slideHeight) / 2 + 'px'
    slide.style.left = (window.innerWidth - slideWidth) / 2 + 'px'

    if (scale === 1) {
        slide.style.transform = ''
    } else {
        slide.style.transform = 'scale(' + scale + ')'
    }
}

window.onresize = function () {
    presentation.render(true)
}

function gotoCurrentHash () {
    var section = 0
    var slide = 0
    if (location.hash) {
        var m = location.hash.match(/#slide-(\d+)-(\d+)/)
        section = parseInt(m[1], 10),
        slide = parseInt(m[2], 10)
    }

    presentation.updatePosition(section, slide)

    presentation.render()
}

window.onpopstate = function(event) {
    gotoCurrentHash()
};

gotoCurrentHash()

function onSpace (e) {
    if (e.shiftKey) {
        presentation.navigate('prevSlide')
    } else {
        presentation.navigate('nextSlide')
    }
}

function onArrowLeft () {
    presentation.navigate('leftSlide')
}

function onArrowUp () {
    presentation.navigate('upSlide')
}

function onArrowRight () {
    presentation.navigate('rightSlide')
}

function onArrowDown () {
    presentation.navigate('downSlide')
}

function onHome() {
    presentation.navigate('restart')
}

function onEnd() {
    presentation.navigate('showLastSlide')
}

var keyHandlers = {
    32: onSpace,
    35: onEnd,
    36: onHome,
    37: onArrowLeft,
    38: onArrowUp,
    39: onArrowRight,
    40: onArrowDown,
    83: onToggleNotes
}

function keydownHandler(e) {
    if (!e.metaKey && !e.ctrlKey) {
        var handler = keyHandlers[e.keyCode]
        handler && handler(e)
    }
}

function onToggleNotes() {
    if (notesWindow) {
        notesWindow.close()
        notesWindow = null
    } else {
        notesWindow = window.open(
            '',
            'Notes',
            'width=500,height=300'
        )
        notesWindow.document.body.style.fontSize = '20px'
        notesWindow.document.body.style.fontFamily = 'sans-serif'

        var slide = presentation.getCurrentSlide()
        presentation.renderNotes(slide)

        setTimeout(function () {
            notesWindow.document.addEventListener('keydown', keydownHandler)
        }, 1000)
    }
}

document.addEventListener('keydown', keydownHandler)
