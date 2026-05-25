import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface LumieraWelcomeEmailProps {
    first_name?: string;
    last_name?: string;
    email?: string;
    discountCode?: string;
    validUntil?: string;
}

export const LumieraWelcomeEmail = ({
    first_name = "Valued Customer",
    discountCode,
    validUntil,
}: LumieraWelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Lumiera Wellness</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Img
                            src="https://placehold.co/150x50?text=LUMIERA"
                            width="150"
                            height="50"
                            alt="Lumiera Wellness"
                            style={logo}
                        />
                    </Section>

                    <Section style={content}>
                        <Heading style={heading}>Welcome to Lumiera.</Heading>
                        <Text style={greeting}>Hi {first_name},</Text>
                        <Text style={paragraph}>
                            Thank you for creating an account with Lumiera. We are delighted to welcome you to our community dedicated to premium intimate wellness.
                        </Text>
                        <Text style={paragraph}>
                            At Lumiera, we believe in quality, safety, and sophistication. We've curated a collection designed to enhance your well-being with the utmost care and discretion.
                        </Text>

                        {discountCode && (
                            <Section style={discountContainer}>
                                <Text style={discountTitle}>Your Exclusive Welcome Gift</Text>
                                <Text style={discountText}>
                                    As a thank you for joining us, please enjoy 15% off your first order.
                                </Text>
                                <Section style={codeBox}>
                                    <Text style={codeText}>{discountCode}</Text>
                                </Section>
                                {validUntil && (
                                    <Text style={expiryText}>Valid until {validUntil}</Text>
                                )}
                            </Section>
                        )}

                        <Section style={buttonContainer}>
                            <Button style={button} href="https://lumiera.wellness/collection">
                                Explore the Collection
                            </Button>
                        </Section>

                        <Text style={supportNote}>
                            If you have any questions, just reply to this email. We're here to help.
                        </Text>
                    </Section>

                    <Hr style={divider} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            Lumiera Wellness Ltd, London, UK
                        </Text>
                        <Text style={footerLinks}>
                            <Link href="https://lumiera.wellness" style={link}>Visit Website</Link>
                            {" • "}
                            <Link href="https://instagram.com/lumiera" style={link}>Instagram</Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default LumieraWelcomeEmail;

const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
    padding: "20px 0",
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px",
    marginBottom: "64px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    maxWidth: "580px",
};

const header = {
    marginBottom: "32px",
    textAlign: "center" as const,
};

const logo = {
    margin: "0 auto",
};

const content = {
    paddingBottom: "20px",
};

const heading = {
    fontSize: "24px",
    letterSpacing: "-0.5px",
    lineHeight: "1.3",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "24px",
    textAlign: "left" as const,
};

const greeting = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#333",
    marginBottom: "16px",
    fontWeight: "500",
};

const paragraph = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#525252",
    marginBottom: "20px",
};

const discountContainer = {
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    padding: "24px",
    margin: "24px 0",
    border: "1px solid #eaeaea",
    textAlign: "center" as const,
};

const discountTitle = {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
};

const discountText = {
    fontSize: "14px",
    color: "#525252",
    marginBottom: "16px",
};

const codeBox = {
    backgroundColor: "#ffffff",
    border: "1px dashed #d4d4d4",
    borderRadius: "4px",
    padding: "8px 16px",
    display: "inline-block",
    marginBottom: "12px",
};

const codeText = {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: "1px",
    margin: "0",
};

const expiryText = {
    fontSize: "12px",
    color: "#999999",
    margin: "0",
};

const buttonContainer = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#1a1a1a",
    borderRadius: "4px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 32px",
};

const supportNote = {
    fontSize: "14px",
    lineHeight: "24px",
    color: "#737373",
    marginTop: "20px",
};

const divider = {
    borderColor: "#e5e5e5",
    margin: "30px 0 20px",
};

const footer = {
    textAlign: "center" as const,
};

const footerText = {
    fontSize: "12px",
    lineHeight: "20px",
    color: "#999999",
    marginBottom: "10px",
};

const footerLinks = {
    fontSize: "12px",
    color: "#999999",
};

const link = {
    color: "#999999",
    textDecoration: "underline",
};
