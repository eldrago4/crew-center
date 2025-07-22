"use client";
import {
  Input,
  InputGroup,
  Field,
} from "@chakra-ui/react";
import { DarkMode } from "./ui/color-mode";
export default function CallsignInput({ value, onChange }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 3); // only digits, max 3
    onChange(digits);
  };

  return (
    <DarkMode>
    <Field.Root colorPalette="gray.900" mb={3}>
      <Field.Label>Login</Field.Label>
      <InputGroup roundedLeft="sm" startAddon="INVA" bgColor="gray.900" color="fg">
        <Input
          value={value}
          onChange={handleChange}
          inputMode="numeric"
          placeholder="136"
          borderColor="gray.700"
          _focus={{
            borderColor: "indigo.500",
            boxShadow: "0 0 0 2px rgba(99,102,241,0.6)",
          }}
          fontFamily="mono"
          letterSpacing="widest"
        />
      </InputGroup>
      <Field.HelperText color="whiteAlpha.500">
        *Kindly enter callsign between 100–999
      </Field.HelperText>
    </Field.Root></DarkMode>
  );
}
