/* eslint-disable no-plusplus, no-case-declarations */

import { Register8Bit, Register16Bit } from "./Register";
import Framebuffer from "./Framebuffer";
import Memory from "./Memory";
import Stack from "./Stack";
import Keypad from "./Keypad";
import Speaker from "./Speaker";
import Bus from "./Bus";
import Logger from "./Logger";

Logger.setConfig( {
    "it-desc": false,
    "it-opcode": false,
    it: false,
} );
window.Logger = Logger;
const Log = Logger.log;

const FONTS = [
    0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
    0x20, 0x60, 0x20, 0x20, 0x70, // 1
    0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
    0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
    0x90, 0x90, 0xF0, 0x10, 0x10, // 4
    0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
    0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
    0xF0, 0x10, 0x20, 0x40, 0x40, // 7
    0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
    0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
    0xF0, 0x90, 0xF0, 0x90, 0x90, // A
    0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
    0xF0, 0x80, 0x80, 0x80, 0xF0, // C
    0xE0, 0x90, 0x90, 0x90, 0xE0, // D
    0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
    0xF0, 0x80, 0xF0, 0x80, 0x80, // F
];

class CPU {
    constructor() {
        this.V = [];
        this.I = new Register16Bit();
        this.PC = new Register16Bit();
        this.PC.store( 0x200 );
        this.frameBuffer = new Framebuffer( this, 64, 32 );
        this.memory = new Memory();
        this.stack = new Stack();
        this.keypad = new Keypad( this );
        this.pressedKey = null;
        this.keyHandled = true;
        this.speaker = new Speaker( 440 );
        this.delayTimer = [ 0, 0 ]; // First value to keep track of the 60Hz cycle
        this.soundTimer = [ 0, 0 ];
        this.isDrawing = false;

        for ( let i = 0; i <= 0xF; i += 1 ) {
            this.V.push( new Register8Bit() );
        }

        for ( let i = 0; i < FONTS.length; i += 1 ) {
            this.memory.store( i, FONTS[ i ] );
        }

        this.operators = [
            this.zero,
            this.one,
            this.two,
            this.three,
            this.four,
            this.five,
            this.six,
            this.seven,
            this.eight,
            this.nine,
            this.ten,
            this.eleven,
            this.twelve,
            this.thirteen,
            this.fourteen,
            this.fifteen,
        ];
    }

    loadRom( rom ) {
        const romSize = rom.byteLength;

        for ( let i = 0; i < romSize; i += 1 ) {
            this.memory.store( 0x200 + i, rom[ i ] );
        }
    }

    display( monitor ) {
        if ( this.isDrawing ) return;
        this.frameBuffer.drive( monitor );
    }

    reset() {
        this.PC.store( 0x200 );
        this.frameBuffer.clear();
        this.stack.reset();
        this.pressedKey = null;
        this.keyHandled = true;
        this.speaker.stop();
        this.delayTimer = [ 0, 0 ];
        this.soundTimer = [ 0, 0 ];
        this.isDrawing = false;
    }

    cycle() {
        if ( this.waitForKeyPress ) {
            if ( this.pressedKey !== null ) {
                Bus.dispatchEvent( new CustomEvent( "chip8:keypress", { detail: this.pressedKey } ) );
                this.keyHandled = true;
                this.waitForKeyPress = false;
            } else {
                return;
            }
        }

        let pc = this.PC.read();
        const opcode = this.memory.read( pc++ ) << 8 | this.memory.read( pc++ );

        this.PC.store( pc & 0x0FFF );

        if ( this.delayTimer[ 1 ] > 0 ) {
            this.delayTimer[ 1 ] -= 1;
        }

        if ( this.soundTimer[ 1 ] > 0 ) {
            this.soundTimer[ 1 ] -= 1;
        } else {
            this.speaker.stop();
        }

        Log( "it-opcode", `Opcode: ${opcode.toString( 16 )}` );
        this.operators[ ( ( opcode & 0xF000 ) >> 12 ) ].call( this, opcode );
    }

    zero = ( opcode ) => {
        const kk = opcode & 0x00FF;

        switch ( kk ) {
        case 0xE0:
            Log( "it", "CLS" );
            Log( "it-desc", "Clear Screen" );
            this.frameBuffer.clear();
            break;
        case 0xEE:
            Log( "it", "RET" );
            this.PC.store( this.stack.pop() );
            Log( "it-desc", `Return to ${this.PC.read().toString( 16 )}` );
            break;
        default:
            Log( "it", "Fail:", opcode );
            Log( "it-desc", "Failed" );

            break;
        }
    }

    one = ( opcode ) => {
        const nnn = opcode & 0x0FFF;
        Log( "it", `JP ${nnn.toString( 16 )}` );
        Log( "it-desc", `Jump to address ${nnn.toString( 16 )}` );

        this.PC.store( nnn & 0x0FFF );
    }

    two = ( opcode ) => {
        const nnn = opcode & 0x0FFF;
        Log( "it", `CALL ${nnn.toString( 16 )}` );
        Log( "it-desc", `Call subroutine at address ${nnn.toString( 16 )}` );

        this.stack.push( this.PC.read() );
        this.PC.store( nnn );
    }

    three = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const kk = opcode & 0x00FF;
        Log( "it", `SE V${x}, ${kk.toString( 16 )}` );
        Log( "it-desc", `Skip the next inst if V${x} = ${kk.toString( 16 )}` );

        if ( this.V[ x ].read() === kk ) {
            this.PC.incrementBy2();
        }
    }

    four = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const kk = opcode & 0x00FF;
        Log( "it", `SNE V${x}, ${kk.toString( 16 )}` );
        Log( "it-desc", `Skip the next inst if V${x} != ${kk.toString( 16 )}` );

        if ( this.V[ x ].read() !== kk ) {
            this.PC.incrementBy2();
        }
    }

    five = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const y = ( opcode & 0x00F0 ) >> 4;
        Log( "it", `SE V${x}, V${y}` );
        Log( "it-desc", `Skip the next inst if V${x} = V${y}` );

        if ( this.V[ x ].read() === this.V[ y ].read() ) {
            this.PC.incrementBy2();
        }
    }

    six = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const kk = opcode & 0x0FF;
        Log( "it", `LD V${x}, ${kk.toString( 16 )}` );
        Log( "it-desc", `Set V${x} to ${kk.toString( 16 )}` );

        this.V[ x ].store( kk );
    }

    seven = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const kk = opcode & 0x0FF;
        Log( "it", `ADD V${x}, ${kk.toString( 16 )}` );
        Log( "it-desc", `Increase V${x} by ${kk.toString( 16 )}` );

        this.V[ x ].incrementByN( kk );
    }

    eight = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const y = ( opcode & 0x00F0 ) >> 4;
        let sum;
        let sub;

        switch ( opcode & 0xF00F ) {
        case 0x8000:
            Log( "it", `LD V${x}, V${y}` );
            Log( "it-desc", `Set V${y} to V${x}` );
            this.V[ x ].store( this.V[ y ].read() );

            break;
        case 0x8001:
            Log( "it", `OR V${x}, V${y}` );
            Log( "it-desc", `Set V${x} to V${x} OR V${y}` );
            this.V[ x ].store( this.V[ x ].read() | this.V[ y ].read() );

            break;
        case 0x8002:
            Log( "it", `AND V${x}, V${y}` );
            Log( "it-desc", `Set V${x} to V${x} AND V${y}` );
            this.V[ x ].store( this.V[ x ].read() & this.V[ y ].read() );

            break;
        case 0x8003:
            Log( "it", `XOR V${x}, V${y}` );
            Log( "it-desc", `Set V${x} to V${x} XOR V${y}` );
            this.V[ x ].store( this.V[ x ].read() ^ this.V[ y ].read() );

            break;
        case 0x8004:
            Log( "it", `ADD V${x}, V${y}` );
            Log( "it-desc", `Set V${x} to V${x} + V${y}, set VF to 1 if sum greater than 0xFF, otherwise 0` );
            sum = this.V[ x ].read() + this.V[ y ].read();

            if ( sum > 0xFF ) {
                this.V[ 0x0F ].store( 0x01 );
            } else {
                this.V[ 0x0F ].store( 0x00 );
            }

            this.V[ x ].store( sum & 0xFF );
            break;
        case 0x8005:
            Log( "it", `SUB V${x}, V${y}` );
            Log( "it-desc", `Set V${x} to V${x} - V${y}, if not borrow set VF to 1, otherwise 0` );
            sub = this.V[ x ].read() - this.V[ y ].read();

            if ( sub >= 0 ) {
                this.V[ 0x0F ].store( 0x01 );
            } else {
                this.V[ 0x0F ].store( 0x00 );
            }

            this.V[ x ].store( sub );
            break;
        case 0x8006:
            Log( "it", `SHR V${x}, V${y}` );
            Log( "it-desc", `Shift V${x} 1 bit to the right` );

            this.V[ 0x0F ].store( this.V[ x ].read() & 0x01 );

            this.V[ x ].store( this.V[ x ].read() >> 1 );
            break;
        case 0x8007:
            Log( "it", `SUBN V${x}, V${y}` );
            Log( "it-desc", `Set V${x} to V${y} - V${x}, if not borrow set VF to 1, otherwise 0` );
            sub = this.V[ y ].read() - this.V[ x ].read();

            if ( sub >= 0x00 ) {
                this.V[ 0x0F ].store( 0x01 );
            } else {
                this.V[ 0x0F ].store( 0x00 );
            }

            this.V[ x ].store( sub );
            break;
        case 0x800E:
            Log( "it", `SHL V${x}, V${y}` );
            Log( "it-desc", `Shift V${x} 1 bit to the left` );

            this.V[ 0x0F ].store( this.V[ x ].readBit( 7 ) & 0x01 );

            this.V[ x ].store( this.V[ x ].read() << 1 );
            break;
        default:
            break;
        }
    }

    nine = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const y = ( opcode & 0x00F0 ) >> 4;
        Log( "it", `SNE V${x}, V${y}` );
        Log( "it-desc", `Skip the next inst if V${x} != V${y}` );

        if ( this.V[ x ].read() !== this.V[ y ].read() ) {
            this.PC.incrementBy2();
        }
    }

    ten = ( opcode ) => {
        const nnn = opcode & 0x0FFF;
        Log( "it", `LD I, ${nnn.toString( 16 )}` );
        Log( "it-desc", `Set register I to ${nnn.toString( 16 )}` );

        this.I.store( nnn );
    }

    eleven = ( opcode ) => {
        const nnn = opcode & 0x0FFF;
        Log( "it", `JP V0, ${nnn.toString( 16 )}` );
        Log( "it-desc", `Jump to V0 + ${nnn.toString( 16 )}` );

        this.PC.store( ( this.V[ 0 ].read() + nnn ) );
    }

    twelve = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const kk = opcode & 0x00FF;
        const rand = Math.round( Math.random() * 0xFF );
        Log( "it", `RND V${x}, ${kk.toString( 16 )}` );
        Log( "it-desc", `Set V${x} to a random byte ${rand.toString( 16 )} & ${kk.toString( 16 )}` );

        this.V[ x ].store( rand & kk );
    }

    thirteen = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const y = ( opcode & 0x00F0 ) >> 4;
        const n = opcode & 0x000F;
        const bytes = new Array( n );
        Log( "it", `DRW V${x}, V${y}, ${n}` );
        Log( "it-desc", `Draw at (${this.V[ x ].read()}, ${this.V[ y ].read()}) with height of ${bytes.length}` );

        for ( let i = 0; i < n; i += 1 ) {
            bytes[ i ] = this.memory.read( this.I.read() + i );
        }

        this.V[ 0x0F ].store( 0x00 );

        if ( this.frameBuffer.draw(
            bytes,
            this.V[ x ].read(),
            this.V[ y ].read(),
        ) ) {
            this.V[ 0xF ].store( 1 );
        } else {
            this.V[ 0xF ].store( 0 );
        }
    }

    fourteen = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const kk = opcode & 0x00FF;

        switch ( kk ) {
        case 0x009E:
            Log( "it", `SKP V${x}` );
            Log( "it-desc", `Skip the next inst if pressing key = V${x}` );
            if ( this.V[ x ].read() === this.pressedKey ) {
                this.PC.incrementBy2();
            }
            break;
        case 0x00A1:
            Log( "it", `SKNP V${x}` );
            Log( "it-desc", `Skip the next inst if pressing key != V${x}` );
            if ( this.V[ x ].read() !== this.pressedKey ) {
                this.PC.incrementBy2();
            }
            break;
        default:
            break;
        }
    }

    fifteen = ( opcode ) => {
        const x = ( opcode & 0x0F00 ) >> 8;
        const kk = opcode & 0x00FF;
        let handler = () => {};

        switch ( kk ) {
        case 0x0007:
            Log( "it", `LD V${x}, DT` );
            Log( "it-desc", `Set V${x} to Delay Timer's value` );
            this.V[ x ].store( this.delayTimer[ 1 ] );

            break;
        case 0x000A:
            Log( "it", `LD V${x}, K` );
            Log( "it-desc", `Wait for key press, then store key's value to V${x}` );
            this.waitForKeyPress = true;

            handler = ( ev ) => {
                this.V[ x ].store( ev.detail );
                Bus.removeEventListener( "chip8:keypress", handler );
            };

            Bus.addEventListener( "chip8:keypress", handler );

            break;
        case 0x0015:
            Log( "it", `LD DT, V${x}` );
            Log( "it-desc", `Set Delay Timer's value to V${x}` );
            this.delayTimer[ 0 ] = new Date();
            this.delayTimer[ 1 ] = this.V[ x ].read();

            break;
        case 0x0018:
            Log( "it", `LD ST, V${x}` );
            Log( "it-desc", `LD ST, V${x}` );
            this.soundTimer[ 0 ] = new Date();
            this.soundTimer[ 1 ] = this.V[ x ].read();
            this.speaker.play();

            break;
        case 0x001E:
            Log( "it", `ADD I, V${x}` );
            Log( "it-desc", `Add V${x} to I` );
            this.I.incrementByN( this.V[ x ].read() & 0xFFF );

            break;
        case 0x0029:
            Log( "it", `LD F, V${x}` );
            Log( "it-desc", `Set I = location of sprite for digit at V${x}: ${this.V[ x ].read()}` );
            if ( this.V[ x ].read() > 0xF ) {
                console.warn( x );
            }
            this.I.store( this.V[ x ].read() * 5 );

            break;
        case 0x0033:
            Log( "it", `LD B, V${x}` );
            Log( "it-desc", `Store BCD representation of V${x} in memory locations I, I+1, and I+2.` );
            Log( "it-desc", `V${x} = ${this.V[ x ].read()}` );
            this.memory.store( this.I.read(), this.V[ x ].read() / 100 );
            this.memory.store( this.I.read() + 1, this.V[ x ].read() % 100 / 10 );
            this.memory.store( this.I.read() + 2, this.V[ x ].read() % 10 );

            break;
        case 0x0055:
            Log( "it", `LD [I], V${x}` );
            Log( "it-desc", `Store registers V0 through V${x} in memory starting at location I.` );
            for ( let i = 0; i <= x; i += 1 ) {
                this.memory.store( this.I.read() + i, this.V[ i ].read() );
            }

            this.I.incrementByN( x + 1 );

            break;
        case 0x0065:
            Log( "it", `LD V${x}, [I]` );
            Log( "it-desc", `Read registers V0 through V${x} from memory starting at location I.` );
            for ( let i = 0; i <= x; i += 1 ) {
                this.V[ i ].store( this.memory.read( this.I.read() + i ) );
            }

            this.I.incrementByN( x + 1 );

            break;
        default:
            break;
        }
    }
}

export default CPU;
