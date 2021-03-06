import { Controller, Get, Param, Query } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { Agency } from './agency.entity';

@Controller('agencies')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Get('/stats')
  async findStats(): Promise<number[]> {
    return this.agencyService.findStats();
  }

  @Get('/:id')
  async find(@Param('id') id: string): Promise<Agency> {
    return this.agencyService.findById(id);
  }

  @Get()
  async findByName(@Query('name') name: string): Promise<Agency[]> {
    return this.agencyService.findByName(name);
  }
}
