import CHIP8 from "./CHIP8";
import Bus from "./Bus";

window.addEventListener( "load", () => {
    const canvas = document.querySelector( "#monitor" );
    const ctx = canvas.getContext( "2d" );

    canvas.width = 64 * 10;
    canvas.height = 32 * 10;

    const screen = {
        prevData: [],
        setPixel: ( data, x, y ) => {
            if ( !( y in screen.prevData ) ) screen.prevData[ y ] = [];

            if ( screen.prevData[ y ][ x ] !== data ) {
                screen.prevData[ y ][ x ] = data;
                ctx.fillStyle = data === 0 ? "#090502" : "#795521";
                ctx.fillRect( x * 10, y * 10, 10, 10 );
            }
        },
    };

    const chip8 = new CHIP8( screen );

    document
        .querySelector( "input[type='file']" )
        .addEventListener( "change", function fileChange() {
            const fileReader = new FileReader();
            fileReader.onload = () => {
                Bus.dispatchEvent( new CustomEvent(
                    "romloaded",
                    { detail: new Uint8Array( fileReader.result ) },
                ) );
            };
            const rom = this.files[ 0 ];
            fileReader.readAsArrayBuffer( rom );
        } );

    document
        .querySelector( "#run" )
        .addEventListener( "click", () => {
            Bus.dispatchEvent( new Event( "poweron" ) );
        } );

    document
        .querySelector( "#stop" )
        .addEventListener( "click", () => {
            Bus.dispatchEvent( new Event( "poweroff" ) );
        } );

    document
        .querySelector( "#step" )
        .addEventListener( "click", () => {
            Bus.dispatchEvent( new Event( "step" ) );
        } );

    document
        .querySelector( "#reset" )
        .addEventListener( "click", () => {
            Bus.dispatchEvent( new Event( "reset" ) );
        } );
} );
