import { Register8Bit } from "./Register";

class Stack {
    constructor() {
        this.data = new Uint16Array( new ArrayBuffer( 16 ) );
        this.SP = new Register8Bit();
        this.SP.store( 0x00 );
    }

    pop() {
        this.SP.decrement();
        return this.data[ this.SP.read() ];
    }

    push( value ) {
        this.data[ this.SP.read() ] = value;
        this.SP.increment();
    }

    reset() {
        this.SP.store( 0x00 );
    }
}

export default Stack;
