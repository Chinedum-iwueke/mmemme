import { useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { semantic, space, type as typography } from "@mmemme/tokens";
import {
  Badge,
  Button,
  Card,
  Currency,
  DateInput,
  Dialog,
  EmptyState,
  ErrorState,
  FormError,
  Input,
  KeyboardForm,
  Pagination,
  SafeScreen,
  Select,
  Sheet,
  Skeleton,
  StepTrail,
  TextLink,
  Toast,
} from "../src/components/production-ui";
export default function ComponentGallery() {
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState("venue");
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <KeyboardForm>
      <SafeScreen>
        <Text style={s.eyebrow}>Development component gallery</Text>
        <Text accessibilityRole="header" style={s.title}>
          MMEMME native components
        </Text>
        <Text style={s.copy}>
          Small viewport: {Math.round(width)} points. Increase device text size to 200% to verify
          reflow.
        </Text>
        <StepTrail items={["Marketplace", "Venues", "Lagoon House"]} />
        <Section title="Actions">
          <Button accessibilityLabel="Request this venue">Request this venue</Button>
          <Button accessibilityLabel="Create wedding brief" variant="accent">
            Create wedding brief
          </Button>
          <Button accessibilityLabel="Save for later" variant="secondary">
            Save for later
          </Button>
          <TextLink accessibilityLabel="View cancellation terms" onPress={() => {}}>
            View cancellation terms
          </TextLink>
        </Section>
        <Section title="Forms">
          <Input label="Lagos area" hint="For example, Lekki or Ikeja" placeholder="Lekki" />
          <DateInput label="Wedding date" />
          <Select
            label="Service category"
            value={category}
            onChange={setCategory}
            options={[
              { label: "Venue", value: "venue" },
              { label: "Caterer", value: "caterer" },
            ]}
          />
          <Input label="Receipt email" value="amaka@" error="Enter a valid email address" />
          <FormError>Enter a valid receipt email before continuing.</FormError>
        </Section>
        <Section title="Trust, money and status">
          <Badge tone="trust">MMEMME Verified · checked 12 Jul 2026</Badge>
          <Badge tone="info">Checking with vendor</Badge>
          <Badge tone="success">Booking confirmed</Badge>
          <Badge tone="warning">Quote expires today</Badge>
          <Badge tone="error">Payment not completed</Badge>
          <Card>
            <Text>Deposit due now</Text>
            <Currency kobo={75000000} />
          </Card>
        </Section>
        <Section title="Content states">
          <Skeleton />
          <EmptyState
            title="No matching vendors"
            action={
              <Button accessibilityLabel="Clear filters" variant="secondary">
                Clear filters
              </Button>
            }
          >
            Try changing your filters.
          </EmptyState>
          <ErrorState
            title="We couldn't load vendors"
            action={
              <Button accessibilityLabel="Try loading vendors again" variant="secondary">
                Try again
              </Button>
            }
          >
            Your filters are saved.
          </ErrorState>
          <Pagination page={1} pages={3} onChange={() => {}} />
        </Section>
        <Section title="Overlays">
          <Button accessibilityLabel="Open review dialog" onPress={() => setDialog(true)}>
            Open dialog
          </Button>
          <Button
            accessibilityLabel="Open filters sheet"
            variant="secondary"
            onPress={() => setSheet(true)}
          >
            Open sheet
          </Button>
          <Toast tone="success">Your request draft was saved.</Toast>
        </Section>
        <Dialog visible={dialog} title="Review booking request" onClose={() => setDialog(false)}>
          <Text>Your request does not confirm availability or take payment.</Text>
        </Dialog>
        <Sheet visible={sheet} title="Filter venues" onClose={() => setSheet(false)}>
          <Text>Short contextual choices use a sheet.</Text>
        </Sheet>
      </SafeScreen>
    </KeyboardForm>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text accessibilityRole="header" style={s.heading}>
        {title}
      </Text>
      {children}
    </View>
  );
}
const s = StyleSheet.create({
  eyebrow: {
    fontSize: typography.size.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: semantic.actionPrimary,
  },
  title: { fontSize: typography.size.heading1, fontWeight: "700", color: semantic.textPrimary },
  copy: { fontSize: typography.size.body, color: semantic.textSecondary, lineHeight: 24 },
  section: {
    gap: space[3],
    paddingTop: space[6],
    borderTopWidth: 1,
    borderTopColor: semantic.borderDefault,
  },
  heading: { fontSize: typography.size.heading2, fontWeight: "700", color: semantic.textPrimary },
});
