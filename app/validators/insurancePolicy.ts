import database from "app/database";
import { TableName } from "app/enums";
import { add } from "lodash";
import { InsurancePolicy } from "../models";
import Validator, { Type } from "./validator";

class InsurancePolicyValidator extends Validator<InsurancePolicy> {
    constructor() {
        super();

        this.addValidation('policy_code', {
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

        this.addValidation('company', {
            maxLength: Validator.MAX_STRING_LENGTH,
            required: true,
            type: Type.STRING
        });

        this.addValidation('policy_details', {
            maxLength: Validator.MAX_STRING_LENGTH,
            required: true,
            type: Type.STRING
        });

        this.addValidation('comment', {
            maxLength: Validator.MAX_STRING_LENGTH,
            required: true,
            type: Type.STRING
        });

        this.addValidation('start_date', {
            maxLength: Validator.MAX_STRING_LENGTH,
            required: true,
            type: Type.STRING
        });

        this.addValidation('end_date', {
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

export default new InsurancePolicyValidator();