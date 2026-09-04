const request = require('supertest');
const app = require('../app');
const flightService = require('../services/flight.service');
const { sync, seedFixtures, seedMultipleFlightsPerDay } = require('./helpers/db');

describe('Flight weekly prices', () => {
  beforeEach(async () => {
    await sync();
  });

  describe('service: searchWeeklyPrices', () => {
    it('returns 7 days with the lowest economy price per day', async () => {
      await seedMultipleFlightsPerDay();

      const result = await flightService.searchWeeklyPrices({
        originCode: 'PEK',
        destinationCode: 'SHA',
        startDate: '2026-09-01',
        endDate: '2026-09-07'
      });

      expect(result).toHaveLength(7);
      expect(result[0]).toEqual({ date: '2026-09-01', lowestPrice: 450 });
      expect(result[1]).toEqual({ date: '2026-09-02', lowestPrice: 480 });
      expect(result[2]).toEqual({ date: '2026-09-03', lowestPrice: null });
      expect(result[3]).toEqual({ date: '2026-09-04', lowestPrice: 550 });
      expect(result[4]).toEqual({ date: '2026-09-05', lowestPrice: 490 });
      expect(result[5]).toEqual({ date: '2026-09-06', lowestPrice: 600 });
      expect(result[6]).toEqual({ date: '2026-09-07', lowestPrice: 510 });
    });

    it('excludes cancelled schedules from the lowest price', async () => {
      await seedMultipleFlightsPerDay();

      const result = await flightService.searchWeeklyPrices({
        originCode: 'PEK',
        destinationCode: 'SHA',
        startDate: '2026-09-04',
        endDate: '2026-09-04'
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ date: '2026-09-04', lowestPrice: 550 });
    });

    it('throws when airport codes are invalid', async () => {
      await seedFixtures();

      await expect(flightService.searchWeeklyPrices({
        originCode: 'XXX',
        destinationCode: 'SHA',
        startDate: '2026-09-01',
        endDate: '2026-09-07'
      })).rejects.toThrow('Airport not found');
    });

    it('throws when required params are missing', async () => {
      await seedFixtures();

      await expect(flightService.searchWeeklyPrices({
        originCode: 'PEK',
        destinationCode: 'SHA'
      })).rejects.toThrow('Origin, destination, start date and end date are required');
    });

    it('throws when date format is invalid', async () => {
      await seedFixtures();

      await expect(flightService.searchWeeklyPrices({
        originCode: 'PEK',
        destinationCode: 'SHA',
        startDate: '2026-09-50',
        endDate: '2026-09-07'
      })).rejects.toThrow('Invalid date format');
    });

    it('throws when startDate is after endDate', async () => {
      await seedFixtures();

      await expect(flightService.searchWeeklyPrices({
        originCode: 'PEK',
        destinationCode: 'SHA',
        startDate: '2026-09-07',
        endDate: '2026-09-01'
      })).rejects.toThrow('startDate must be less than or equal to endDate');
    });

    it('throws when date range exceeds maximum', async () => {
      await seedFixtures();

      await expect(flightService.searchWeeklyPrices({
        originCode: 'PEK',
        destinationCode: 'SHA',
        startDate: '2026-09-01',
        endDate: '2026-10-10'
      })).rejects.toThrow('Date range must not exceed 31 days');
    });

    it('keeps date strings unchanged regardless of timezone', async () => {
      await seedFixtures();

      const result = await flightService.searchWeeklyPrices({
        originCode: 'PEK',
        destinationCode: 'SHA',
        startDate: '2026-09-01',
        endDate: '2026-09-01'
      });

      expect(result[0].date).toBe('2026-09-01');
    });
  });

  describe('route: GET /api/flights/weekly', () => {
    it('returns weekly lowest prices for a route', async () => {
      await seedMultipleFlightsPerDay();

      const res = await request(app)
        .get('/api/flights/weekly?origin=PEK&destination=SHA&startDate=2026-09-01&endDate=2026-09-07')
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toHaveLength(7);
      expect(res.body.data[0]).toEqual({ date: '2026-09-01', lowestPrice: 450 });
    });

    it('returns 400 when parameters are missing', async () => {
      const res = await request(app)
        .get('/api/flights/weekly?origin=PEK&destination=SHA')
        .expect(400);

      expect(res.body.code).toBe(400);
    });

    it('returns 400 when airport code is invalid', async () => {
      await seedFixtures();

      const res = await request(app)
        .get('/api/flights/weekly?origin=XXX&destination=SHA&startDate=2026-09-01&endDate=2026-09-07')
        .expect(400);

      expect(res.body.code).toBe(400);
    });

    it('returns 400 when date format is invalid', async () => {
      const res = await request(app)
        .get('/api/flights/weekly?origin=PEK&destination=SHA&startDate=bad&endDate=2026-09-07')
        .expect(400);

      expect(res.body.code).toBe(400);
    });

    it('returns 400 when startDate is after endDate', async () => {
      const res = await request(app)
        .get('/api/flights/weekly?origin=PEK&destination=SHA&startDate=2026-09-07&endDate=2026-09-01')
        .expect(400);

      expect(res.body.code).toBe(400);
    });
  });
});
