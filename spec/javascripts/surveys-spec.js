describe("Surveys", function() {
  var surveys = GOVUK.userSurveys;
  var $block;

  var defaultSurvey = {
    url: 'example.com/default',
    frequency: 1, // no randomness in the test suite pls
    analytics_code: 'user_satisfaction_survey',
    template: '<section id="user-satisfaction-survey" class="visible" aria-hidden="false">' +
              '  <a href="#survey-no-thanks" id="survey-no-thanks">No thanks</a>' +
              '  <a href="javascript:void()" id="take-survey" target="_blank"></a>' +
              '</section>'
  };
  var smallSurvey = {
    startTime: new Date("July 5, 2016").getTime(),
    endTime: new Date("July 10, 2016 23:50:00").getTime(),
    url: 'example.com/small-survey'
  };

  beforeEach(function () {
    $block = $('<div id="banner-notification" style="display: none"></div>' +
               '<div id="global-cookie-message" style="display: none"></div>' +
               '<div id="global-browser-prompt" style="display: none"></div>' +
               '<div id="user-satisfaction-survey-container"></div>');

    $('body').append($block);
    $("#user-satisfaction-survey").remove();

    // Don't actually try and take a survey in test.
    $('#take-survey').on('click', function(e) {
      e.preventDefault();
    });
  });

  afterEach(function () {
    GOVUK.cookie(surveys.cookieNameTakenSurvey, null);
    $block.remove();
  });

  describe("displaySurvey", function() {
    it("displays the user satisfaction div", function () {
      expect($('#user-satisfaction-survey').length).toBe(0);
      surveys.displaySurvey(defaultSurvey);
      expect($('#user-satisfaction-survey').length).toBe(1);
      expect($('#user-satisfaction-survey').hasClass('visible')).toBe(true);
      expect($('#user-satisfaction-survey').attr('aria-hidden')).toBe('false');
    });

    it("links to the url for the survey with a completion redirect query parameter", function () {
      surveys.displaySurvey(defaultSurvey);

      expect($('#take-survey').attr('href')).toContain(defaultSurvey.url);
      expect($('#take-survey').attr('href')).toContain("?c=" + window.location.pathname);
    });

    it("records an event when showing the survey", function() {
      spyOn(surveys, 'trackEvent');
      surveys.displaySurvey(defaultSurvey);
      expect(surveys.trackEvent).toHaveBeenCalledWith(defaultSurvey.analytics_code, 'banner_shown', 'Banner has been shown');
    });
  });

  // this is a crap function name, fix it
  describe("shouldSurveyDisplay", function() {
    it("returns false if another notification banner is visible", function() {
      $('#global-cookie-message').css('display', 'block');

      expect(surveys.shouldSurveyDisplay(defaultSurvey)).toBeFalsy();
    });

    it("returns false if the 'survey taken' cookie is set", function () {
      GOVUK.cookie(surveys.cookieNameTakenSurvey, 'true');

      expect(surveys.shouldSurveyDisplay(defaultSurvey)).toBeFalsy();
    });

    it("returns false when the random number does not match", function() {
      spyOn(surveys, 'randomNumberMatches').and.returnValue(false);
      expect(surveys.shouldSurveyDisplay(defaultSurvey)).toBeFalsy();
    });

    it("returns true when the random number matches", function() {
      spyOn(surveys, 'randomNumberMatches').and.returnValue(true);
      expect(surveys.shouldSurveyDisplay(defaultSurvey)).toBeTruthy();
    });
  });

  describe("Event handlers", function () {
      beforeEach(function() {
        surveys.displaySurvey(defaultSurvey);
      });

      it("sets a cookie when clicking 'take survey'", function () {
        $('#take-survey').trigger('click');
        expect(GOVUK.cookie(surveys.cookieNameTakenSurvey)).toBe('true');
      });

      it("sets a cookie when clicking 'no thanks'", function () {
        $('#survey-no-thanks').trigger('click');
        expect(GOVUK.cookie(surveys.cookieNameTakenSurvey)).toBe('true');
      });

      it("hides the satisfaction survey bar after clicking 'take survey'", function () {
        $('#take-survey').trigger('click');
        expect($('#user-satisfaction-survey').hasClass('visible')).toBe(false);
        expect($('#user-satisfaction-survey').attr('aria-hidden')).toBe('true');
      });

      it("hides the satisfaction survey bar after clicking 'no thanks'", function () {
        $('#survey-no-thanks').trigger('click');
        expect($('#user-satisfaction-survey').hasClass('visible')).toBe(false);
      });

      it("records an event when clicking 'take survey'", function() {
        spyOn(surveys, 'trackEvent');
        $('#take-survey').trigger('click');
        expect(surveys.trackEvent).toHaveBeenCalledWith(defaultSurvey.analytics_code, 'banner_taken', 'User taken survey');
      });

      it("records an event when clicking 'no thanks'", function() {
        spyOn(surveys, 'trackEvent');
        $('#survey-no-thanks').trigger('click');
        expect(surveys.trackEvent).toHaveBeenCalledWith(defaultSurvey.analytics_code, 'banner_no_thanks', 'No thanks clicked');
      });
  });

  describe("currentTime", function() {
    it("actually returns a value from `currentTime`", function() {
      expect(surveys.currentTime()).not.toBe(undefined);
    });
  });

  describe("getActiveSurvey", function() {
    it("returns the default survey when no smallSurveys are present", function() {
      var smallSurveys = [smallSurvey];

      var activeSurvey = surveys.getActiveSurvey(defaultSurvey, smallSurveys);
      expect(activeSurvey).toBe(defaultSurvey);
    });

    it("returns the default survey when a smallSurvey is not active", function() {
      var smallSurveys = [smallSurvey];
      spyOn(surveys, 'currentTime').and.returnValue(new Date("July 11, 2016 10:00:00").getTime());

      var activeSurvey = surveys.getActiveSurvey(defaultSurvey, smallSurveys);
      expect(activeSurvey).toBe(defaultSurvey);
    });

    it("returns the small survey when a smallSurvey is active", function() {
      var smallSurveys = [smallSurvey];
      spyOn(surveys, 'currentTime').and.returnValue(new Date("July 9, 2016 10:00:00").getTime());

      var activeSurvey = surveys.getActiveSurvey(defaultSurvey, smallSurveys);
      expect(activeSurvey).toBe(smallSurvey);
    });
  });
});
