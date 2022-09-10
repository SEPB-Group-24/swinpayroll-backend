import { TableName } from "app/enums";
import { insurance_policy } from "../models";
import Validator, { Type } from "./validator";
class InsurancePolicyValidator extends Validator<insurance_policy> {
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
                    addError('is invalid');
                }
            },
            required: true,
            type: Type.STRING
        });

        this.addValidation('insurance_company_id', {
            custom: async ({ addError, value}, database) => {
                const record = await database.knex(TableName.INSURANCE_COMPANIES)
                .where('id', value)
                .first();

                if (!record) {
                    addError('is invalid');
                }
            },
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
                    addError('invalid');
                    return;
                }
                
                if (date < new Date(data.start_date)) {
                    addError('cannot be before the start of the contract');
                }
            },
            required: true,
            type: Type.STRING     
        });
    }
}

export default new InsurancePolicyValidator();
