import { TestBed } from '@angular/core/testing';

import { ScraperFacadeService } from './scraper-facade.service';

describe('ScraperFacadeService', () => {
  let service: ScraperFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScraperFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
