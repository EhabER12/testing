import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FormField as ApiFormField,
  BilingualText,
} from "@/store/services/formService";
import { AlertCircle } from "lucide-react";

interface DynamicFormFieldProps {
  field: ApiFormField;
  control: any;
  locale?: "ar" | "en";
}

// Helper to get localized text
const getLocalizedText = (
  value: string | BilingualText | undefined,
  locale: "ar" | "en"
): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale] || value.en || value.ar || "";
};

/**
 * Renders a form field based on its type
 */
export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  control,
  locale = "ar",
}) => {
  const {
    id,
    label: rawLabel,
    fieldType,
    type,
    placeholder: rawPlaceholder,
    required,
    options: rawOptions = [],
    isAttachment,
    originalType,
  } = field;

  // Get localized values
  const label = getLocalizedText(rawLabel, locale);
  const placeholder = getLocalizedText(rawPlaceholder, locale);
  const options = rawOptions.map((opt) => getLocalizedText(opt, locale));

  // First check for attachment flags, then fallback to fieldType or type
  let effectiveType = fieldType || type;

  // Handle attachment field type restoration
  if (
    isAttachment ||
    originalType === "attachment" ||
    effectiveType === "attachment"
  ) {
    effectiveType = "attachment";
  }

  // Also check the `type` field directly for attachment
  if (type === "attachment") {
    effectiveType = "attachment";
  }

  const renderFieldByType = () => {
    switch (effectiveType) {
      case "text":
      case "email":
      case "tel":
      case "number":
      case "date":
        return (
          <FormField
            control={control}
            name={id}
            rules={{ required: required ? `${label} is required` : false }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {label}{" "}
                  {required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type={effectiveType}
                    placeholder={placeholder}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <FormField
            control={control}
            name={id}
            rules={{ required: required ? `${label} is required` : false }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {label}{" "}
                  {required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Textarea placeholder={placeholder} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "select":
        return (
          <FormField
            control={control}
            name={id}
            rules={{ required: required ? `${label} is required` : false }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {label}{" "}
                  {required && <span className="text-destructive">*</span>}
                </FormLabel>
                <Select
                  onValueChange={formField.onChange}
                  defaultValue={formField.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={placeholder || "Select an option"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            <FormLabel>
              {label} {required && <span className="text-destructive">*</span>}
            </FormLabel>
            {options.map((option) => (
              <FormField
                key={`${id}-${option}`}
                control={control}
                name={id}
                render={({ field: formField }) => (
                  <FormItem
                    key={option}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={
                          Array.isArray(formField.value) &&
                          formField.value.includes(option)
                        }
                        onCheckedChange={(checked) => {
                          let updatedValue = [...(formField.value || [])];
                          if (checked) {
                            updatedValue.push(option);
                          } else {
                            updatedValue = updatedValue.filter(
                              (val) => val !== option
                            );
                          }
                          formField.onChange(updatedValue);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{option}</FormLabel>
                  </FormItem>
                )}
              />
            ))}
            <FormMessage />
          </div>
        );

      case "radio":
        return (
          <FormField
            control={control}
            name={id}
            rules={{ required: required ? `${label} is required` : false }}
            render={({ field: formField }) => (
              <FormItem className="space-y-3">
                <FormLabel>
                  {label}{" "}
                  {required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                    className="flex flex-col space-y-1"
                  >
                    {options.map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${id}-${option}`} />
                        <Label htmlFor={`${id}-${option}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "attachment":
        return (
          <FormField
            control={control}
            name={id}
            rules={{
              required: required ? `${label} is required` : false,
              validate: {
                fileType: (value) => {
                  if (!required && !value) return true;
                  if (required && !value) return `${label} is required`;
                  // Add file validation if needed
                  return true;
                },
              },
            }}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {label}{" "}
                  {required && <span className="text-destructive">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="*/*" // Accept all file types by default
                    className="cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      formField.onChange(file);
                    }}
                    onBlur={formField.onBlur}
                  />
                </FormControl>
                <FormDescription>
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>Maximum file size: 10MB</span>
                  </div>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <div className="p-2 text-muted-foreground border rounded">
            Unsupported field type: {effectiveType}
          </div>
        );
    }
  };

  return renderFieldByType();
};
