class Memory {
    constructor() {
        this.data = new Uint8Array( new ArrayBuffer( 0x1000 ) );
    }

    read( address ) {
        return this.data[ address ];
    }

    store( address, value ) {
        this.data[ address ] = value;
    }
}

export default Memory;
