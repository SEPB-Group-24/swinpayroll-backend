import { Subcontract } from '../models';
import Validator, { Type } from './validator';

class SubcontractValidator extends Validator<Subcontract> {
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

    this.addValidation('down_payment1', {
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('down_payment2', {
      required: true,
      type: Type.NUMBER
    });

    this.addValidation('down_payment3', {
      required: true,
      type: Type.NUMBER
    });
  }
}

export default new SubcontractValidator();
