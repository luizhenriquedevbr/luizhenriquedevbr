<?php

namespace Tests\Unit;

use App\Support\Decimal;
use PHPUnit\Framework\TestCase;

class DecimalTest extends TestCase
{
    public function test_normaliza_formatos(): void
    {
        $this->assertSame('120.5', Decimal::normalize('120,5'));
        $this->assertSame('1234.56', Decimal::normalize('1.234,56'));
        $this->assertSame('119.90', Decimal::normalize('119.90'));
        $this->assertNull(Decimal::normalize(null));
        $this->assertNull(Decimal::normalize(''));
        $this->assertSame('10', Decimal::normalize(10));
    }
}
