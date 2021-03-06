import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from '../employee/employee.entity';
import { getManager, Repository } from 'typeorm';
import * as fs from 'fs';
import { parse } from '@fast-csv/parse';
import { Agency } from '../agency/agency.entity';

@Injectable()
export class BootstrapDataService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Agency)
    private agencyRepository: Repository<Agency>,
  ) {
    this.insertData().then();
  }

  async insertData(): Promise<void> {
    const employeeCount = await this.employeeRepository.count();
    if (employeeCount > 0) {
      console.log('No need to bootstrap');
    } else {
      console.log('Do the bootstrapping magic!');
      fs.createReadStream('./public-salaries-ot-2021.csv')
        .pipe(parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', async row => {
          try {
            let {
              Agency: agency,
              Employee: name,
              'Job Title': jobTitle,
              'Original Hire Date': originalHireDate,
              'Annual Base Salary': salary,
              Overtime: overtime,
              year = 2021,
            } = row;
            name = name.trim();
            salary = Number(salary.replace(/[^0-9\.-]+/g, ''));
            overtime = Number(overtime.replace(/[^0-9\.-]+/g, '')) || 0;
            // Currently zeroing out negative overtime
            overtime = Math.max(overtime, 0);
            return await this.employeeRepository.save({
              agency,
              name,
              jobTitle,
              salary,
              overtime,
              totalAnnualAmount: salary + overtime,
              originalHireDate,
              year,
            });
          } catch (error) {
            console.log(error);
          }
        })
        .on('end', (rowCount: number) => {
          console.log(`Parsed ${rowCount} employees`);
          this.insertAgencyData();
        });
    }
  }

  async insertAgencyData(): Promise<void> {
    const agencyCount = await this.agencyRepository.count();
    if (agencyCount > 0) {
      console.log('Agencies already created');
    } else {
      await getManager().query(
        `INSERT INTO agency
SELECT row_number() over (), employee.agency as name, count(employee.name) as employeeCount, max(employee.salary) as topSalary, 
       max(employee.overtime) as topOvertime, max(employee."totalAnnualAmount") as topPay, percentile_cont(0.5) within group ( order by employee."totalAnnualAmount" ) as medianPay, 
       sum(employee.salary) as totalSalary, sum(employee.overtime) as totalOvertime, sum(employee."totalAnnualAmount") as totalPay, employee.year from employee group by employee.agency, employee.year;`,
      );
    }
  }
}
