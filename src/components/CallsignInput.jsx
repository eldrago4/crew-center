import {
  Input,
  InputGroup,
  Field,
} from "@chakra-ui/react";

export default function CallsignInput({ value, onChange }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 3); // only digits, max 3
    onChange(digits);
  };

  return (
    <Field.Root>
      <Field.Label>Login</Field.Label>
      <InputGroup startAddon="INVA">
        <Input
          value={value}
          onChange={handleChange}
          inputMode="numeric"
          placeholder="136"
          bg="gray.900"
          color="white"
          borderColor="gray.700"
          _focus={{
            borderColor: "indigo.500",
            boxShadow: "0 0 0 2px rgba(99,102,241,0.6)",
          }}
          fontFamily="mono"
          letterSpacing="widest"
        />
      </InputGroup>
      <Field.HelperText>
        *Kindly enter callsign between 100–999
      </Field.HelperText>
    </Field.Root>
  );
}
