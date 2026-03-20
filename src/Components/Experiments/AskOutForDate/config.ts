export type AskOutContent = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  question: string;
  dateLabel: string;
  placeLabel: string;
  fromLabel: string;
  yesText: string;
  noText: string;
  noMessages: string[];
  acceptedTitle: string;
  acceptedMessage: string;
  shareHint: string;
};

export const DEFAULT_CONTENT: AskOutContent = {
  heroBadge: 'Special Invitation',
  heroTitle: 'A Tiny Question, Big Courage',
  heroSubtitle: 'I made this page just for you.',
  question: 'Would you like to go out on a date with me?',
  dateLabel: 'Date',
  placeLabel: 'Place',
  fromLabel: 'From',
  yesText: 'Yes, absolutely!',
  noText: 'No',
  noMessages: [
    'That button seems shy today.',
    'Maybe give the yes button a chance?',
    'The no button just panic-jumped.',
    'Plot twist: yes is looking better and better.',
    'This is destiny being dramatic.'
  ],
  acceptedTitle: 'It is a Date!',
  acceptedMessage: 'This invitation is now official. Screenshot it, share it, and let us make a beautiful memory.',
  shareHint: 'You can share the generated invitation image or copy this page link.'
};

export const ENCODED_QUERY_KEY = 'd';

export const ENCODED_QUERY_HELP_TEXT =
  '?d=eyJuYW1lIjoiUml5YSIsImRhdGUiOiIyMSBNYXJjaCAyMDI2IiwicGxhY2UiOiJCbHVlIFRva2FpIiwiZnJvbSI6IkFuZWVzaCJ9';
