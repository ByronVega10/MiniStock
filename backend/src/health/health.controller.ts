import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'El backend de MiniStock está funcionando.',
    };
  }
}
