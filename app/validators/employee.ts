import { phone } from 'phone';

import { MaritalStatus, Sex, TableName } from '../enums';
import { Employee } from '../models';
import Validator, { Type } from './validator';

class EmployeeValidator extends Validator<Employee> {
  constructor() {
    super();

    this.addValidation('code', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('name', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('address', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('phone', {
      custom: ({ addError, value }) => {
        if (!phone(value).isValid) {
          addError('is not a valid mobile international phone number');
          return;
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('date_of_birth', {
      custom: ({ addError, value }) => {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
          addError('is invalid');
          return;
        }

        if (date > new Date()) {
          addError('can\'t be in the future');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('sex', {
      enum: Sex,
      required: true,
      type: Type.STRING
    });

    this.addValidation('marital_status', {
      enum: MaritalStatus,
      required: true,
      type: Type.STRING
    });

    this.addValidation('referee', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('emergency_name', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('emergency_address', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('emergency_phone', {
      custom: ({ addError, value }) => {
        if (!phone(value).isValid) {
          addError('is not a valid mobile international phone number');
          return;
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('hired_date', {
      custom: ({ addError, value }) => {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
          addError('is invalid');
          return;
        }

        if (date > new Date()) {
          addError('can\'t be in the future');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('skill', {
      maxLength: Validator.MAX_STRING_LENGTH,
      required: true,
      type: Type.STRING
    });

    this.addValidation('hourly_rate', {
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('overtime_rate', {
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('project_id', {
      custom: async ({ addError, value }, database) => {
        const record = await database.knex(TableName.PROJECTS)
          .where('id', value)
          .first();

        if (!record) {
          addError('is invalid');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('position_id', {
      custom: async ({ addError, value }, database) => {
        const record = await database.knex(TableName.POSITIONS)
          .where('id', value)
          .first();

        if (!record) {
          addError('is invalid');
        }
      },
      required: true,
      type: Type.STRING
    });

    this.addValidation('subcontract_id', {
      custom: async ({ addError, value }, database) => {
        const record = await database.knex(TableName.PROJECTS)
          .where('id', value)
          .first();

        if (!record) {
          addError('is invalid');
        }
      },
      required: false,
      type: Type.STRING
    });
  }
}

export default new EmployeeValidator();
