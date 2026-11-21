// LEAVES station micro:bit
// Button: one leg on P1, the other on GND.
// Motor:  P8 → motor driver input (never connect the motor straight to the micro:bit).
//
// How to use: makecode.microbit.org → New Project → switch to "JavaScript" at the top,
// delete everything, paste this file, then Download. You can switch back to Blocks afterwards.
//
// Messages (max 19 characters):  sends  leaves:BLOW, leaves:DONE
//                                 hears  leaves:PLACED, leaves:LEFT

let PROJECT = "leaves"
let BLOW_TIME = 5000
let phoneHere = false

radio.setGroup(77)
radio.setTransmitPower(7)
pins.setPull(DigitalPin.P1, PinPullMode.PullUp)
pins.digitalWritePin(DigitalPin.P8, 0)
basic.showIcon(IconNames.Asleep)

function send(cmd: string) {
    // sent twice, in case one copy is lost (the laptop ignores the duplicate)
    radio.sendString(PROJECT + ":" + cmd)
    basic.pause(20)
    radio.sendString(PROJECT + ":" + cmd)
}

function showWaiting() {
    if (phoneHere) {
        basic.showIcon(IconNames.Happy)
    } else {
        basic.showIcon(IconNames.Asleep)
    }
}

radio.onReceivedString(function (receivedString) {
    if (receivedString == PROJECT + ":PLACED") {
        phoneHere = true
        showWaiting()
    } else if (receivedString == PROJECT + ":LEFT") {
        phoneHere = false
        showWaiting()
    }
})

basic.forever(function () {
    // button pressed = P1 pulled to GND = 0
    if (pins.digitalReadPin(DigitalPin.P1) == 0) {
        send("BLOW")
        pins.digitalWritePin(DigitalPin.P8, 1)
        basic.showLeds(`
            . . . . .
            # # # . .
            . . # # #
            # # # . .
            . . . . .
            `)
        basic.pause(BLOW_TIME)
        pins.digitalWritePin(DigitalPin.P8, 0)
        send("DONE")
        showWaiting()
        // wait until the button is let go, so holding it doesn't restart the fan
        while (pins.digitalReadPin(DigitalPin.P1) == 0) {
            basic.pause(20)
        }
    }
    basic.pause(20)
})
