class Register {
    store( value ) {
        this.data[ 0 ] = value;
    }

    read() {
        return this.data[ 0 ];
    }

    storeBit( bitPosition, value ) {
        this.data[ 0 ] &= ( ~( 1 << bitPosition ) | ( value << bitPosition ) );
    }

    readBit( bitPosition ) {
        return ( this.data[ 0 ] >> bitPosition ) & 1;
    }

    increment() {
        this.data[ 0 ] += 1;
    }

    incrementBy2() {
        this.data[ 0 ] += 2;
    }

    incrementByN( N ) {
        this.data[ 0 ] += N;
    }

    decrement() {
        this.data[ 0 ] -= 1;
    }

    decrementBy2() {
        this.data[ 0 ] -= 2;
    }

    decrementByN( N ) {
        this.data[ 0 ] -= N;
    }
}

class Register8Bit extends Register {
    constructor() {
        super();
        this.data = new Uint8Array( 1 );
    }
}

class Register16Bit extends Register {
    constructor() {
        super();
        this.data = new Uint16Array( 1 );
    }
}

export {
    Register8Bit,
    Register16Bit,
};
