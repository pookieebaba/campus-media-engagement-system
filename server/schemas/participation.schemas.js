const { z } = require('zod');

const rsvpSchema = z.object({
  rsvpStatus: z.enum(['going', 'not_going'], {
    errorMap: () => ({ message: 'RSVP status must be going or not_going' }),
  }),
});

module.exports = { rsvpSchema };
