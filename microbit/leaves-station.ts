// LEAVES station micro:bit  (DFRobot micro:bit shield + Gravity fan module)
// Button: the micro:bit's own button A
// Fan:    Gravity fan module on P8
//
// How to use: makecode.microbit.org → New Project → switch to "JavaScript" at the top,
// delete everything, paste this file, then Download. You can switch back to Blocks afterwards.
//
// Messages (max 19 characters):  sends  leaves:BLOW, leaves:DONE
//                                 hears  leaves:PLACED, leaves:LEFT
//
// Screen:  💤 waiting, no phone   🙂 waiting, phone in place   ≡ fan running

let PROJECT = "leaves"
let BLOW_TIME = 5000
// Fan on = 1. If the fan spins when it should be off and stops when it should spin, change to 0.
let FAN_ON = 1
let FAN_OFF = 1 - FAN_ON
let phoneHere = false

radio.setGroup(77)
radio.setTransmitPower(7)
pins.digitalWritePin(DigitalPin.P8, FAN_OFF)
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
    if (input.buttonIsPressed(Button.A)) {
        send("BLOW")
        pins.digitalWritePin(DigitalPin.P8, FAN_ON)
        basic.showLeds(`
            . . . . .
            # # # . .
            . . # # #
            # # # . .
            . . . . .
            `)
        basic.pause(BLOW_TIME)
        pins.digitalWritePin(DigitalPin.P8, FAN_OFF)
        send("DONE")
        showWaiting()
        // wait until button A is let go, so holding it doesn't restart the fan
        while (input.buttonIsPressed(Button.A)) {
            basic.pause(20)
        }
    }
    basic.pause(20)
})
