/* eslint-disable object-property-newline */

const KEYMAP = {
    9: { key: 0x01 }, 0: { key: 0x02 }, "-": { key: 0x03 }, "=": { key: 0x0C },
    i: { key: 0x04 }, o: { key: 0x05 }, p: { key: 0x06 }, "[": { key: 0x0D },
    j: { key: 0x07 }, k: { key: 0x08 }, l: { key: 0x09 }, ";": { key: 0x0E },
    n: { key: 0x0A }, m: { key: 0x00 }, ",": { key: 0x0B }, ".": { key: 0x0F },
};

class Keypad {
    constructor( cpu ) {
        this.cpu = cpu;

        document.addEventListener( "keydown", ( event ) => {
            const keyName = event.key;

            if ( keyName in KEYMAP ) {
                this.cpu.pressedKey = KEYMAP[ keyName ].key;
                this.cpu.keyHandled = false;
            }
        } );

        document.addEventListener( "keyup", () => {
            if ( this.cpu.waitForKey ) {
                if ( !this.cpu.keyHandled ) {
                    this.cpu.pressedKey = null;
                }
            } else {
                this.cpu.pressedKey = null;
            }
        } );
    }
}

export default Keypad;
