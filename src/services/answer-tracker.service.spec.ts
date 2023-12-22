import { TestBed } from "@angular/core/testing";

import { AnswerTrackerService } from "./answer-tracker.service";

describe("AnswerTrackerService", () => {
  let service: AnswerTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnswerTrackerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
