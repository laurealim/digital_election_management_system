<?php

namespace Tests\Unit\Services;

use Tests\TestCase;

class VoteHashTest extends TestCase
{
    private string $salt;

    protected function setUp(): void
    {
        parent::setUp();
        $this->salt = config('app.vote_hash_salt', 'test-salt');
    }

    public function test_hash_is_deterministic(): void
    {
        $payload = '1|2|3|4';

        $hash1 = hash_hmac('sha256', $payload, $this->salt);
        $hash2 = hash_hmac('sha256', $payload, $this->salt);

        $this->assertEquals($hash1, $hash2);
    }

    public function test_different_inputs_produce_different_hashes(): void
    {
        $hashA = hash_hmac('sha256', '1|2|3|4', $this->salt);
        $hashB = hash_hmac('sha256', '1|2|3|5', $this->salt);

        $this->assertNotEquals($hashA, $hashB);
    }

    public function test_different_salts_produce_different_hashes(): void
    {
        $payload = '10|20|30|40';

        $hashA = hash_hmac('sha256', $payload, 'salt-one');
        $hashB = hash_hmac('sha256', $payload, 'salt-two');

        $this->assertNotEquals($hashA, $hashB);
    }

    public function test_hash_is_64_char_hex(): void
    {
        $hash = hash_hmac('sha256', '1|2|3|4', $this->salt);

        $this->assertEquals(64, strlen($hash));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $hash);
    }

    public function test_actual_vote_produces_valid_hash(): void
    {
        $data = $this->buildActiveElectionWithVoter();

        $payload = "{$data['voter']->id}|{$data['election']->id}|{$data['post1']->id}|{$data['cand1']->id}";
        $hash    = hash_hmac('sha256', $payload, $this->salt);

        $this->assertEquals(64, strlen($hash));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $hash);
    }
}
