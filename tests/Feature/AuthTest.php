<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function usuario(): User
    {
        return User::create(['name' => 'Luiz', 'email' => 'luiz@example.com', 'password' => 'segredo-123']);
    }

    public function test_login_ok_retorna_token(): void
    {
        $user = $this->usuario();

        $this->postJson('/api/login', ['email' => 'luiz@example.com', 'password' => 'segredo-123'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']])
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonMissingPath('user.password');
    }

    public function test_login_senha_errada_422(): void
    {
        $this->usuario();

        $this->postJson('/api/login', ['email' => 'luiz@example.com', 'password' => 'errada'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_rota_protegida_sem_token_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_me_com_token_retorna_usuario(): void
    {
        $this->usuario();
        $token = $this->postJson('/api/login', ['email' => 'luiz@example.com', 'password' => 'segredo-123'])->json('token');

        $this->withHeader('Authorization', "Bearer $token")->getJson('/api/me')
            ->assertOk()->assertJsonPath('email', 'luiz@example.com');
    }

    public function test_logout_revoga_token(): void
    {
        $this->usuario();
        $token = $this->postJson('/api/login', ['email' => 'luiz@example.com', 'password' => 'segredo-123'])->json('token');
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withHeader('Authorization', "Bearer $token")->postJson('/api/logout')->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_admin_seeder_nao_duplica(): void
    {
        config(['admin.email' => 'admin@example.com', 'admin.name' => 'Admin', 'admin.password' => 'x-123456']);

        $this->seed(\Database\Seeders\AdminSeeder::class);
        $this->seed(\Database\Seeders\AdminSeeder::class);

        $this->assertSame(1, User::where('email', 'admin@example.com')->count());
    }
}
