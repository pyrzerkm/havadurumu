import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    console.log('AuthController: Login request:', loginDto);
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    console.log('AuthController: validateUser result:', user);
    
    if (!user) {
      console.log('AuthController: Kullanıcı doğrulanamadı');
      throw new Error('Invalid credentials - User not found or password incorrect');
    }
    
    const result = await this.authService.login(user);
    console.log('AuthController: Login result:', result);
    return result;
  }

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string; name: string }) {
    return this.authService.register(registerDto.email, registerDto.password, registerDto.name);
  }

  @UseGuards(AuthGuard)
  @Post('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('create-admin')
  async createAdmin() {
    return this.authService.register('admin@weather.com', 'admin123', 'Admin User');
  }

  @Post('create-user')
  async createUser() {
    return this.authService.register('user@weather.com', 'user123', 'Test User');
  }
}
