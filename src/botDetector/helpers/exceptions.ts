export class BadBotDetected extends Error {
  constructor(message = 'Bad bot detected') {
    super(message);
    this.name = 'BadBotDetected';
  }
}

export class GoodBotDetected extends Error {
  constructor(message = 'Good bot detected') {
    super(message);
    this.name = 'GoodBotDetected';
  }
}
