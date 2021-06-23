import { Controller, Get, Param, Query } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Employee } from './employee.entity';
import { EmployeeQueryDto } from './EmployeeQueryDto';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('/:id')
  async find(@Param('id') id: string): Promise<Employee> {
    return this.employeeService.findById(id);
  }

  @Get()
  async findByName(@Query() queryDto: EmployeeQueryDto): Promise<Employee[]> {
    return this.employeeService.findByName(queryDto);
  }
}
