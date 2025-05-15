export type EmailOptions = {
  minimumSubDomains: number;
  allowDomainLiteral: boolean;
  allowDisplayText: boolean;
};

export const defaultEmailOptions: Readonly<EmailOptions> = {
  minimumSubDomains: 0,
  allowDomainLiteral: true,
  allowDisplayText: true,
};
