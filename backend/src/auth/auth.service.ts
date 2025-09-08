import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('AuthService: validateUser çağrıldı', { email, password: '***' });
    
    try {
      const user = await this.usersService.findByEmail(email);
      console.log('AuthService: Kullanıcı bulundu:', user ? 'Evet' : 'Hayır');
      
      if (user) {
        console.log('AuthService: Kullanıcı detayları:', {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          hasPassword: !!user.password
        });
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('AuthService: Şifre doğru mu?', isPasswordValid);
        
        if (isPasswordValid) {
          console.log('AuthService: Kullanıcı doğrulandı, Mongoose document döndürülüyor');
          return user;
        } else {
          console.log('AuthService: Şifre yanlış');
        }
      } else {
        console.log('AuthService: Kullanıcı bulunamadı');
      }
    } catch (error) {
      console.error('AuthService: validateUser hatası:', error);
    }
    
    console.log('AuthService: Kullanıcı doğrulanamadı');
    return null;
  }

  async login(user: any) {
    console.log('AuthService: login çağrıldı, user:', user);
    
    // Mongoose document'inden veri al
    const userData = user._doc || user;
    console.log('AuthService: userData:', userData);
    
    const payload = { email: userData.email, sub: userData._id, role: userData.role };
    console.log('AuthService: JWT payload:', payload);
    
    const response = {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: userData._id,
        id: userData._id, // Frontend compatibility için
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
    };
    
    console.log('AuthService: Login response:', response);
    return response;
  }

  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
      role: 'user',
    });
    
    const { password: _, ...result } = user;
    return result;
  }
}
