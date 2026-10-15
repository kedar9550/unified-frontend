import React from 'react';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Lock,
  ChevronDown,
  CircleDot,
  CheckSquare,
  Calendar,
  Upload,
  ToggleLeft,
  Heading,
  FileText,
  Minus
} from 'lucide-react';

export const FIELD_TYPES = [
  {
    type: 'text',
    label: 'Text Input',
    icon: Type,
    category: 'Basic Inputs',
    description: 'Single line text input for short answers',
    defaultProps: {
      label: 'Single Line Text',
      placeholder: 'Enter text here...',
      helpText: '',
      required: false,
      defaultValue: '',
      colSpan: 1, // 1 = half width (in 2-col mode), 2 = full width
      validation: {
        minLength: '',
        maxLength: '',
        pattern: '',
        customErrorMessage: ''
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: AlignLeft,
    category: 'Basic Inputs',
    description: 'Multi-line text area for detailed responses',
    defaultProps: {
      label: 'Long Text / Description',
      placeholder: 'Enter details here...',
      helpText: '',
      required: false,
      defaultValue: '',
      colSpan: 2,
      validation: {
        minLength: '',
        maxLength: '',
        rows: 4
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'number',
    label: 'Number',
    icon: Hash,
    category: 'Basic Inputs',
    description: 'Numeric input for quantities, marks or amounts',
    defaultProps: {
      label: 'Number',
      placeholder: '0',
      helpText: '',
      required: false,
      defaultValue: '',
      colSpan: 1,
      validation: {
        minNumber: '',
        maxNumber: '',
        step: 1
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'email',
    label: 'Email Address',
    icon: Mail,
    category: 'Basic Inputs',
    description: 'Validated email input',
    defaultProps: {
      label: 'Email Address',
      placeholder: 'example@adityauniversity.in',
      helpText: 'We will send confirmations to this address',
      required: true,
      defaultValue: '',
      colSpan: 1,
      validation: {
        maxLength: 120
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'phone',
    label: 'Phone Number',
    icon: Phone,
    category: 'Basic Inputs',
    description: 'Phone / Mobile number with format validation',
    defaultProps: {
      label: 'Mobile / Phone Number',
      placeholder: '9876543210',
      helpText: 'Enter 10-digit mobile number',
      required: false,
      defaultValue: '',
      colSpan: 1,
      validation: {
        minLength: 10,
        maxLength: 15
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'password',
    label: 'Password',
    icon: Lock,
    category: 'Basic Inputs',
    description: 'Masked password input field',
    defaultProps: {
      label: 'Password',
      placeholder: '••••••••',
      helpText: '',
      required: false,
      defaultValue: '',
      colSpan: 1,
      validation: {
        minLength: 6,
        maxLength: 32
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'dropdown',
    label: 'Dropdown / Select',
    icon: ChevronDown,
    category: 'Choice & Selection',
    description: 'Dropdown selection menu',
    defaultProps: {
      label: 'Select an Option',
      placeholder: '-- Choose an option --',
      helpText: '',
      required: false,
      defaultValue: '',
      colSpan: 1,
      options: [
        { label: 'Option 1', value: 'option_1' },
        { label: 'Option 2', value: 'option_2' },
        { label: 'Option 3', value: 'option_3' }
      ],
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'radio',
    label: 'Radio Buttons',
    icon: CircleDot,
    category: 'Choice & Selection',
    description: 'Single-choice radio buttons list',
    defaultProps: {
      label: 'Choose One',
      helpText: '',
      required: false,
      defaultValue: '',
      colSpan: 2,
      options: [
        { label: 'First Choice', value: 'first_choice' },
        { label: 'Second Choice', value: 'second_choice' }
      ],
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'checkbox',
    label: 'Checkboxes',
    icon: CheckSquare,
    category: 'Choice & Selection',
    description: 'Multiple selection checkboxes',
    defaultProps: {
      label: 'Select all that apply',
      helpText: '',
      required: false,
      defaultValue: [],
      colSpan: 2,
      options: [
        { label: 'Item A', value: 'item_a' },
        { label: 'Item B', value: 'item_b' },
        { label: 'Item C', value: 'item_c' }
      ],
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'date',
    label: 'Date Picker',
    icon: Calendar,
    category: 'Basic Inputs',
    description: 'Date selection input',
    defaultProps: {
      label: 'Date',
      placeholder: 'YYYY-MM-DD',
      helpText: '',
      required: false,
      defaultValue: '',
      colSpan: 1,
      validation: {
        minDate: '',
        maxDate: ''
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: Upload,
    category: 'Advanced',
    description: 'Upload documents, PDFs or images',
    defaultProps: {
      label: 'Upload Document / File',
      helpText: 'Allowed formats: PDF, JPG, PNG (Max 10MB)',
      required: false,
      colSpan: 2,
      validation: {
        allowedFileTypes: '.pdf,.png,.jpg,.jpeg,.docx',
        maxFileSizeMB: 10
      },
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'yes_no',
    label: 'Yes / No',
    icon: ToggleLeft,
    category: 'Choice & Selection',
    description: 'Binary Yes/No boolean toggle switch',
    defaultProps: {
      label: 'Do you agree to the terms?',
      helpText: '',
      required: false,
      defaultValue: 'no',
      colSpan: 1,
      readOnly: false,
      hidden: false
    }
  },
  {
    type: 'heading',
    label: 'Section Heading',
    icon: Heading,
    category: 'Layout & Presentation',
    description: 'Header text to divide sections',
    defaultProps: {
      label: 'Section Header Title',
      helpText: 'Optional section subtitle or instructions',
      colSpan: 2
    }
  },
  {
    type: 'paragraph',
    label: 'Paragraph / Description',
    icon: FileText,
    category: 'Layout & Presentation',
    description: 'Informational rich text block for instructions',
    defaultProps: {
      label: 'Instructions / Guidelines',
      content: 'Please read the following guidelines carefully before completing this form. Ensure all provided details are authentic.',
      colSpan: 2
    }
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: Minus,
    category: 'Layout & Presentation',
    description: 'Horizontal divider line separating sections',
    defaultProps: {
      label: 'Divider',
      colSpan: 2
    }
  }
];

// Helper to generate unique field key
export function generateFieldKey(label, existingKeys = []) {
  let baseKey = (label || 'field')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'field';

  let key = baseKey;
  let counter = 1;
  while (existingKeys.includes(key)) {
    key = `${baseKey}_${counter}`;
    counter++;
  }
  return key;
}

// Create a new field instance from a type
export function createNewField(type, existingFields = []) {
  const definition = FIELD_TYPES.find((f) => f.type === type) || FIELD_TYPES[0];
  const existingKeys = existingFields.map((f) => f.name);
  const id = 'fld_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  const name = generateFieldKey(definition.defaultProps.label || type, existingKeys);

  return {
    id,
    type: definition.type,
    name,
    ...JSON.parse(JSON.stringify(definition.defaultProps))
  };
}
