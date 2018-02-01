import test from "ava";
import CPU from "../src/CPU";

let cpu;

test.beforeEach( ( t ) => {
    cpu = new CPU();
} );

test( "0x00E0", ( t ) => {
    cpu.memory.store( 0x200, 0x00 );
    cpu.memory.store( 0x201, 0xE0 );
    cpu.cycle();
    t.pass();
} );

test( "0x00EE", ( t ) => {
    cpu.memory.store( 0x200, 0x00 );
    cpu.memory.store( 0x201, 0xEE );
    cpu.cycle();
    t.pass();
} );

test( "0x12FF", ( t ) => {
    cpu.memory.store( 0x200, 0x12 );
    cpu.memory.store( 0x201, 0xFF );
    cpu.cycle();

    t.is( cpu.PC.read(), 0x2FF );
    t.pass();
} );

test( "0x22FF", ( t ) => {
    cpu.memory.store( 0x200, 0x22 );
    cpu.memory.store( 0x201, 0xFF );
    cpu.cycle();

    t.is( cpu.PC.read(), 0x2FF );
    t.is( cpu.stack.pop(), 0x202 );
    t.pass();
} );
