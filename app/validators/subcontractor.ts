import database from "app/database";
import { TableName } from "app/enums";
import { add } from "lodash";
import { InsurancePolicy } from "../models";
import Validator, { Type } from "./validator";

class SubcontractorValidator extends Validator<Subcontractor> {
    constructor() {
        super();

        this.addValidation('subcontractor_code', {
            maxLength: Validator.MAX_STRING_LENGTH,
            required: true,
            type: Type.STRING
        });

        this.addValidation('project_id', {
            custom: async ({ addError, value}, database) => {
                const record = await database.knex(TableName.PROJECTS)
                    .where('id', value)
                    .first();

                if (!record) {
                    addError('Invalid ID');
                }
            },
            required: true,
            type: Type.STRING
        });

        this.addValidation('name', {
            maxLength: Validator.MAX_STRING_LENGTH,
            required: true,
            type: Type.STRING
        });

        this.addValidation('contract_value', {
            
            required: true,
            type: Type.NUMBER
        });

       this.addValidation('down_payment_1', {
      required: true,
      type: Type.NUMBER
        });
        
  this.addValidation('down_payment_2', {
      required: true,
      type: Type.NUMBER
  });
  
  this.addValidation('down_payment_3', {
      required: true,
      type: Type.NUMBER
  });

        this.addValidation('contract_start_date', {
            maxLength: Validator.MAX_STRING_LENGTH,
            required: true,
            type: Type.STRING
        });

        this.addValidation('contract_end_date', {
            custom: ({addError, data, value}) => {
                const date = new Date(value);

                if(isNaN(date.getTime())) {
                    addError('Invalid date');
                    return;
                }
                
                if (date < new Date(data.start_date)) {
                    addError('date cannot be before the start of the contract');
                }
            },
            required: true,
            type: Type.STRING     
        });
    }
}

export default new SubcontractorValidator();
