<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'

gsap.registerPlugin(MorphSVGPlugin)

const topLine = {
  width: 6973,
  letters: [
    { x: 0, advance: 659, d: 'M221 0L221 144L352 144Q390 144 413 164.5Q436 185 436 221Q436 245 425.5 262.5Q415 280 396.5 289Q378 298 352 298L221 298L221 436L343 436Q375 436 396 452Q417 468 417 502Q417 536 396 552Q375 568 343 568L221 568L221 712L399 712Q464 712 512.5 687.5Q561 663 588 620.5Q615 578 615 523Q615 447 561 399Q507 351 403 344L401 413Q514 406 574 351Q634 296 634 210Q634 148 603 100.5Q572 53 516.5 26.5Q461 0 387 0ZM59 0L59 712L255 712L255 0Z' },
    { x: 659, advance: 709, d: 'M491 0L242 371L479 712L720 712L446 342L446 406L731 0ZM59 0L59 712L259 712L259 0Z' },
    { x: 1548, advance: 596, d: 'M59 0L59 712L259 712L259 0ZM221 253L221 419L571 419L571 253ZM221 546L221 712L586 712L586 546Z' },
    { x: 2144, advance: 830, d: 'M411 -14Q327 -14 256.5 14Q186 42 133.5 92Q81 142 52 210Q23 278 23 357Q23 437 51.5 504Q80 571 132 621Q184 671 254.5 698.5Q325 726 409 726Q493 726 563.5 698.5Q634 671 686 621Q738 571 766.5 503.5Q795 436 795 356Q795 277 766.5 209.5Q738 142 686 91.5Q634 41 564 13.5Q494 -14 411 -14ZM409 162Q465 162 506 186Q547 210 569 254Q591 298 591 357Q591 401 578.5 436.5Q566 472 542 497.5Q518 523 484.5 536.5Q451 550 409 550Q353 550 312 526.5Q271 503 249 459.5Q227 416 227 357Q227 312 239.5 276Q252 240 276 214.5Q300 189 333.5 175.5Q367 162 409 162Z' },
    { x: 2974, advance: 790, d: 'M411 -14Q327 -14 256.5 14Q186 42 133.5 92Q81 142 52 210Q23 278 23 357Q23 437 51.5 504Q80 571 132 621Q184 671 254.5 698.5Q325 726 409 726Q493 726 563.5 698.5Q634 671 686 621Q738 571 766.5 503.5Q795 436 795 356Q795 277 766.5 209.5Q738 142 686 91.5Q634 41 564 13.5Q494 -14 411 -14ZM409 162Q465 162 506 186Q547 210 569 254Q591 298 591 357Q591 401 578.5 436.5Q566 472 542 497.5Q518 523 484.5 536.5Q451 550 409 550Q353 550 312 526.5Q271 503 249 459.5Q227 416 227 357Q227 312 239.5 276Q252 240 276 214.5Q300 189 333.5 175.5Q367 162 409 162Z' },
    { x: 3764, advance: 659, d: 'M229 0L229 712L429 712L429 0ZM16 542L16 712L643 712L643 542Z' },
    { x: 4423, advance: 659, d: 'M221 0L221 144L352 144Q390 144 413 164.5Q436 185 436 221Q436 245 425.5 262.5Q415 280 396.5 289Q378 298 352 298L221 298L221 436L343 436Q375 436 396 452Q417 468 417 502Q417 536 396 552Q375 568 343 568L221 568L221 712L399 712Q464 712 512.5 687.5Q561 663 588 620.5Q615 578 615 523Q615 447 561 399Q507 351 403 344L401 413Q514 406 574 351Q634 296 634 210Q634 148 603 100.5Q572 53 516.5 26.5Q461 0 387 0ZM59 0L59 712L255 712L255 0Z' },
    { x: 5082, advance: 747, d: 'M6 0L277 712L481 712L749 0L541 0L342 605L414 605L210 0ZM182 120L182 276L580 276L580 120Z' },
    { x: 5829, advance: 572, d: 'M59 0L59 712L259 712L259 0ZM222 0L222 170L555 170L555 0Z' },
    { x: 6401, advance: 572, d: 'M59 0L59 712L259 712L259 0ZM222 0L222 170L555 170L555 0Z' },
  ],
}

const bottomLine = {
  width: 6863,
  letters: [
    { x: 0, advance: 642, d: 'M221 250L221 394L350 394Q373 394 392.5 403.5Q412 413 424 432.5Q436 452 436 481Q436 510 424 529.5Q412 549 392.5 558.5Q373 568 350 568L221 568L221 712L389 712Q458 712 513.5 684.5Q569 657 601.5 605.5Q634 554 634 481Q634 409 601.5 357Q569 305 513.5 277.5Q458 250 389 250ZM59 0L59 712L259 712L259 0Z' },
    { x: 642, advance: 661, d: 'M221 284L221 422L342 422Q383 422 404.5 442Q426 462 426 495Q426 528 404.5 548Q383 568 342 568L221 568L221 712L374 712Q448 712 504 685Q560 658 592 610Q624 562 624 498Q624 434 591.5 386Q559 338 501 311Q443 284 364 284ZM59 0L59 712L259 712L259 0ZM443 0L249 304L429 343L670 0Z' },
    { x: 1303, advance: 639, d: 'M59 0L59 712L259 712L259 0ZM221 0L221 166L603 166L603 0ZM221 282L221 444L566 444L566 282ZM221 546L221 712L597 712L597 546Z' },
    { x: 1942, advance: 768, d: 'M193 0L193 170L359 170Q415 170 456 190.5Q497 211 519 253Q541 295 541 357Q541 419 518.5 460Q496 501 455.5 521.5Q415 542 359 542L183 542L183 712L359 712Q443 712 513.5 687Q584 662 636 615Q688 568 716.5 502.5Q745 437 745 356Q745 275 716.5 209.5Q688 144 636 97Q584 50 514 25Q444 0 361 0ZM59 0L59 712L259 712L259 0Z' },
    { x: 2710, advance: 318, d: 'M59 0L59 712L259 712L259 0Z' },
    { x: 3028, advance: 687, d: 'M411 -12Q329 -12 258.5 15.5Q188 43 135 93Q82 143 52.5 210.5Q23 278 23 357Q23 437 52.5 504Q82 571 134.5 620Q187 669 257 696.5Q327 724 409 724Q492 724 561 698Q630 672 681 626L548 492Q524 518 489.5 533Q455 548 409 548Q369 548 335.5 535Q302 522 278 497Q254 472 240.5 436.5Q227 401 227 357Q227 312 240.5 276.5Q254 241 278 216Q302 191 335.5 177.5Q369 164 409 164Q454 164 489.5 178Q525 192 551 219L685 85Q632 39 566 13.5Q500 -12 411 -12Z' },
    { x: 3715, advance: 659, d: 'M229 0L229 712L429 712L429 0ZM16 542L16 712L643 712L643 542Z' },
    { x: 4374, advance: 318, d: 'M59 0L59 712L259 712L259 0Z' },
    { x: 4692, advance: 818, d: 'M411 -14Q327 -14 256.5 14Q186 42 133.5 92Q81 142 52 210Q23 278 23 357Q23 437 51.5 504Q80 571 132 621Q184 671 254.5 698.5Q325 726 409 726Q493 726 563.5 698.5Q634 671 686 621Q738 571 766.5 503.5Q795 436 795 356Q795 277 766.5 209.5Q738 142 686 91.5Q634 41 564 13.5Q494 -14 411 -14ZM409 162Q465 162 506 186Q547 210 569 254Q591 298 591 357Q591 401 578.5 436.5Q566 472 542 497.5Q518 523 484.5 536.5Q451 550 409 550Q353 550 312 526.5Q271 503 249 459.5Q227 416 227 357Q227 312 239.5 276Q252 240 276 214.5Q300 189 333.5 175.5Q367 162 409 162Z' },
    { x: 5510, advance: 744, d: 'M59 0L59 712L199 712L259 562L259 0ZM549 0L136 519L199 712L612 193ZM549 0L499 158L499 712L699 712L699 0Z' },
    { x: 6254, advance: 609, d: 'M289 -12Q198 -12 130.5 14.5Q63 41 6 99L131 224Q170 187 213 167.5Q256 148 305 148Q346 148 367 160.5Q388 173 388 195Q388 217 370 231.5Q352 246 322.5 257.5Q293 269 257.5 281Q222 293 187 310Q152 327 122.5 351.5Q93 376 75 412.5Q57 449 57 502Q57 571 90 621Q123 671 183 697.5Q243 724 324 724Q404 724 472.5 698.5Q541 673 586 626L460 501Q427 533 394 548.5Q361 564 322 564Q291 564 272.5 554Q254 544 254 524Q254 503 272 489.5Q290 476 319.5 465Q349 454 384.5 442Q420 430 455 413.5Q490 397 519.5 371.5Q549 346 567 308Q585 270 585 216Q585 107 507.5 47.5Q430 -12 289 -12Z' },
  ],
}

const wordmark = ref(null)
let mediaContext

function shapeFor(letter, index) {
  const width = Math.max(letter.advance - 52, 250)
  const left = 26
  const right = width
  const middle = (left + right) / 2
  const variant = index % 5

  if (variant === 0) return `M${middle} 28L${right} 168L${right - 34} 550L${middle} 694L${left + 34} 550L${left} 168Z`
  if (variant === 1) return `M${left} 356L${middle} 28L${right} 356L${middle} 694ZM${middle} 198L${right - 116} 356L${middle} 524L${left + 116} 356Z`
  if (variant === 2) return `M${left} 42L${right} 42L${right - 82} 356L${right} 670L${left} 670L${left + 82} 356Z`
  if (variant === 3) return `M${middle} 24L${right} 178L${right - 24} 546L${middle} 688L${left + 24} 546L${left} 178ZM${middle} 198L${right - 150} 270L${right - 130} 448L${middle} 520L${left + 130} 448L${left + 150} 270Z`
  return `M${left} 86L${right - 70} 86L${right} 220L${right - 140} 356L${right} 492L${right - 70} 626L${left} 626L${left + 112} 356Z`
}

onMounted(() => {
  mediaContext = gsap.matchMedia()

  mediaContext.add('(prefers-reduced-motion: no-preference)', () => {
    const context = gsap.context(() => {
      const letters = gsap.utils.toArray('.morph-letter')

      gsap.set(letters, {
        morphSVG: { shape: (index, target) => target.dataset.shape, map: 'size' },
      })

      const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.35 })

      timeline.to(letters, {
        duration: 1.35,
        morphSVG: {
          shape: (index, target) => target.dataset.letter,
          type: 'rotational',
          map: 'size',
        },
        stagger: { each: 0.045, from: 'center' },
        ease: 'expo.inOut',
      })
      timeline.to({}, { duration: 2.8 })
      timeline.to(letters, {
        duration: 1.1,
        morphSVG: {
          shape: (index, target) => target.dataset.shape,
          type: 'rotational',
          map: 'position',
        },
        stagger: { each: 0.035, from: 'edges' },
        ease: 'power3.inOut',
      })
      timeline.to({}, { duration: 0.65 })

      return () => timeline.kill()
    }, wordmark.value)

    return () => context.revert()
  })
})

onBeforeUnmount(() => mediaContext?.revert())
</script>

<template>
  <div ref="wordmark" class="morph-wordmark mt-7">
    <h1 class="sr-only">BK Football Predictions</h1>

    <svg class="morph-line morph-line--top" :viewBox="`0 0 ${topLine.width} 740`" aria-hidden="true">
      <defs>
        <linearGradient id="wordmark-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.48" stop-color="#f2f4ea" />
          <stop offset="1" stop-color="#9fb66b" />
        </linearGradient>
        <filter id="wordmark-shadow" x="-20%" y="-30%" width="150%" height="170%">
          <feDropShadow dx="32" dy="38" stdDeviation="10" flood-color="#101a08" flood-opacity="0.86" />
        </filter>
      </defs>
      <g transform="translate(0 726) scale(1 -1)" filter="url(#wordmark-shadow)">
        <path
          v-for="(letter, index) in topLine.letters"
          :key="`top-${index}`"
          class="morph-letter"
          :d="letter.d"
          :data-letter="letter.d"
          :data-shape="shapeFor(letter, index)"
          :transform="`translate(${letter.x} 0)`"
          fill="url(#wordmark-white)"
          fill-rule="evenodd"
        />
      </g>
    </svg>

    <svg class="morph-line morph-line--bottom" :viewBox="`0 0 ${bottomLine.width} 740`" aria-hidden="true">
      <defs>
        <linearGradient id="wordmark-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#dfff83" />
          <stop offset="0.42" stop-color="#a8d83f" />
          <stop offset="1" stop-color="#6e921d" />
        </linearGradient>
      </defs>
      <g transform="translate(0 726) scale(1 -1)" filter="url(#wordmark-shadow)">
        <path
          v-for="(letter, index) in bottomLine.letters"
          :key="`bottom-${index}`"
          class="morph-letter"
          :d="letter.d"
          :data-letter="letter.d"
          :data-shape="shapeFor(letter, index + topLine.letters.length)"
          :transform="`translate(${letter.x} 0)`"
          fill="url(#wordmark-green)"
          fill-rule="evenodd"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.morph-wordmark {
  width: min(100%, 61rem);
  min-width: 0;
  filter: drop-shadow(0 1.25rem 2.5rem rgb(0 0 0 / 0.3));
}

.morph-line {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.morph-line--bottom { margin-top: -0.075em; }

.morph-letter { shape-rendering: geometricPrecision; }

@media (max-width: 420px) {
  .morph-wordmark { width: 108%; }
}
</style>
