// GATEWAY micro:bit  —  stays plugged into the laptop by USB.
// Passes radio messages from project micro:bits to the laptop,
// and laptop messages (from phones) out over the radio.
//
// How to use: makecode.microbit.org → New Project → switch to "JavaScript" at the top,
// delete everything, paste this file, then Download to the gateway micro:bit
// (drag the .hex onto the MICROBIT drive — don't leave MakeCode paired/connected).
// Every project micro:bit must use the same radio group (77).
//
// Screen:  ✓ = running
//          bottom-left dot blinks  = a radio message went to the laptop
//          bottom-right dot blinks = the laptop sent something (proves USB → micro:bit works)
//          top-right dot blinks every 2 s = "I'm alive" sent to the laptop

// The micro:bit's USB chip can hold short messages back until it has a full 64-byte
// packet to send, which delays them by many seconds. So every message is followed by
// a line of spaces that fills the packet and pushes it out at once (the laptop ignores blank lines).
let PAD = "                                                                \n"

radio.setGroup(77)
radio.setTransmitPower(7)
serial.redirectToUSB()
serial.setBaudRate(BaudRate.BaudRate115200)
serial.setTxBufferSize(254)
basic.showIcon(IconNames.Yes)

function toLaptop(line: string) {
    serial.writeString(line + "\n" + PAD)
}

// radio → laptop
radio.onReceivedString(function (receivedString) {
    toLaptop(receivedString)
    led.toggle(0, 4)
})

// laptop → radio
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    led.toggle(4, 4)
    if (line.includes("gateway:PING")) {
        toLaptop("gateway:READY")
    } else if (line.length > 0) {
        // send twice, in case one copy is lost
        radio.sendString(line)
        basic.pause(20)
        radio.sendString(line)
    }
})

// heartbeat, so the laptop knows the gateway is there (and can measure USB delays)
basic.forever(function () {
    toLaptop("gateway:ALIVE")
    led.toggle(4, 0)
    basic.pause(2000)
})
