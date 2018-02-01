class Framebuffer {
    constructor( cpu, width, height ) {
        this.width = width;
        this.height = height;
        this.data = [];
        this.cpu = cpu;

        for ( let i = 0; i < this.height; i += 1 ) {
            this.data[ i ] = [];
            for ( let j = 0; j < this.width; j += 1 ) {
                this.data[ i ][ j ] = 0;
            }
        }
    }

    drive( screen ) {
        this.cpu.isDrawing = true;
        for ( let i = 0; i < this.height; i += 1 ) {
            for ( let j = 0; j < this.width; j += 1 ) {
                screen.setPixel( this.data[ i ][ j ], j, i );
            }
        }
        this.cpu.isDrawing = false;
    }

    draw( data, x, y ) {
        let isCollision = 0;
        let cBit;
        let pBit;
        let cX;
        let cY;

        for ( let v = 0; v < data.length; v += 1 ) {
            cY = y + v;

            if ( cY >= this.height ) {
                continue;
            }

            for ( let u = 0; u < 8; u += 1 ) {
                cBit = data[ v ] >> ( 7 - u ) & 0x01;
                cX = x + u;

                if ( cX >= this.width ) {
                    continue;
                }

                pBit = this.data[ cY ][ cX ];

                if ( pBit === cBit && pBit === 1 ) {
                    isCollision = 1;
                }

                this.data[ cY ][ cX ] = cBit ^ pBit;
            }
        }

        return isCollision;
    }

    clear() {
        for ( let i = 0; i < this.height; i += 1 ) {
            this.data[ i ] = [];
            for ( let j = 0; j < this.width; j += 1 ) {
                this.data[ i ][ j ] = 0;
            }
        }
    }
}

export default Framebuffer;
