import CPU from "./CPU";
import Bus from "./Bus";

class CHIP8 {
    constructor( screen ) {
        this.CPU = new CPU();
        this.screen = screen;
        this.running = false;

        Bus.addEventListener( "reset", () => {
            this.running = false;
            this.CPU.reset();
            this.CPU.display( this.screen );
        } );

        Bus.addEventListener( "poweron", () => {
            this.running = true;
            this.run();
        } );

        Bus.addEventListener( "poweroff", () => {
            this.running = false;
        } );

        Bus.addEventListener( "romloaded", ( event ) => {
            this.CPU.loadRom( event.detail );
        } );

        Bus.addEventListener( "step", () => {
            this.step();
        } );
    }

    step() {
        this.CPU.cycle();

        document.querySelector( "#PC" ).innerText = this.CPU.PC.read().toString( 16 );
        document.querySelector( "#I" ).innerText = this.CPU.I.read().toString( 16 );

        for ( let j = 0; j <= 0xF; j += 1 ) {
            document.querySelector( `#v${j}` ).innerText = this.CPU.V[ j ].read().toString( 16 );
        }

        this.CPU.display( this.screen );
    }

    tick() {
        this.timeoutHandle = setTimeout( () => {
            if ( this.running ) {
                for ( let i = 0; i < 12; i += 1 ) {
                    this.CPU.cycle();

                    document.querySelector( "#PC" ).innerText = this.CPU.PC.read().toString( 16 );
                    document.querySelector( "#I" ).innerText = this.CPU.I.read().toString( 16 );

                    for ( let j = 0; j <= 0xF; j += 1 ) {
                        document.querySelector( `#v${j}` ).innerText = this.CPU.V[ j ].read().toString( 16 );
                    }
                }
                this.CPU.display( this.screen );
                requestAnimationFrame( this.tick.bind( this ) );
            }
        }, 1000 / 60 );
    }

    run() {
        requestAnimationFrame( this.tick.bind( this ) );
    }
}

export default CHIP8;
