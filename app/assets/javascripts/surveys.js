(function() {
  "use strict";

  var root = this,
      $ = root.jQuery;
  if(typeof root.GOVUK === 'undefined') { root.GOVUK = {}; }

  var TEMPLATE = '<section id="user-satisfaction-survey" class="visible" aria-hidden="false">' +
                 '  <div class="wrapper">' +
                 '    <h1>Tell us what you think of GOV.UK</h1>' +
                 '    <p class="right"><a href="#survey-no-thanks" id="survey-no-thanks">No thanks</a></p>' +
                 '    <p><a href="javascript:void()" id="take-survey" target="_blank">Take the 3 minute survey</a> This will open a short survey on another website</p>' +
                 '  </div>' +
                 '</section>';

  var userSurveys = {
    defaultSurvey: {
      url: 'https://www.surveymonkey.com/s/2MRDLTW',
      identifier: 'user_satisfaction_survey',
      template: TEMPLATE,
      frequency: 50,
    },
    smallSurveys: [
      {
        url: '',
        template: TEMPLATE,
        identifier: '',
        frequency: 1,
        startTime: new Date("May 4, 2016").getTime(),
        endTime: new Date("May 5, 2016 23:59:59").getTime()
      }
    ],

    init: function() {
      var activeSurvey = userSurveys.getActiveSurvey(userSurveys.defaultSurvey, userSurveys.smallSurveys);
      if (userSurveys.shouldSurveyDisplay(activeSurvey)) {
        userSurveys.displaySurvey(activeSurvey);
      }
    },

    getActiveSurvey: function(defaultSurvey, smallSurveys) {
      var activeSurvey = defaultSurvey;

      $.each(smallSurveys, function(_index, survey) {
        if(userSurveys.currentTime() >= survey.startTime && userSurveys.currentTime() <= survey.endTime) {
          activeSurvey = survey;
        }
      });

      return activeSurvey;
    },

    displaySurvey: function(survey) {
      $("#user-satisfaction-survey-container").append(survey.template);
      userSurveys.setEventHandlers(survey);

      var $surveyLink = $('#take-survey');
      var surveyUrl = survey.url;

      if (surveyUrl.indexOf('?c=') === -1) {
        surveyUrl += "?c=" + root.location.pathname;
      }

      $surveyLink.attr('href', surveyUrl);
      userSurveys.trackEvent(survey.identifier, 'banner_shown', 'Banner has been shown');
    },

    setEventHandlers: function(survey) {
      var $noThanks = $('#survey-no-thanks');
      var $takeSurvey = $('#take-survey');

      $noThanks.click(function (e) {
        userSurveys.setCookieTakenSurvey(survey);
        userSurveys.trackEvent(survey.identifier, 'banner_no_thanks', 'No thanks clicked');
        e.stopPropagation();
        return false;
      });
      $takeSurvey.click(function () {
        userSurveys.setCookieTakenSurvey(survey);
        userSurveys.trackEvent(survey.identifier, 'banner_taken', 'User taken survey');
      });
    },

    shouldSurveyDisplay: function(survey) {
      if (userSurveys.otherNotificationVisible() ||
          GOVUK.cookie(userSurveys.cookieNameTakenSurvey(survey)) === 'true') {
        return false;
      } else if (userSurveys.userCompletedTransaction()) {
        // We don't want any survey appearing for users who have completed a
        // transaction as they may complete the survey with the department's
        // transaction in mind as opposed to the GOV.UK content.
        return false;
      } else if ($('#user-satisfaction-survey-container').length <= 0) {
        return false;
      } else if (userSurveys.randomNumberMatches(survey.frequency)) {
        return true;
      } else {
        return false;
      }
    },

    userCompletedTransaction: function() {
      var currentURL = window.location.pathname;

      function stringContains(str, substr) {
        return str.indexOf(substr) > -1;
      }

      if (stringContains(currentURL, "/done") &&
          stringContains(currentURL, "/transaction-finished") &&
          stringContains(currentURL, "/driving-transaction-finished")) {
            return true;
      }
    },

    trackEvent: function (identifier, action, label) {
      GOVUK.analytics.trackEvent(identifier, action, {
        label: label,
        value: 1,
        nonInteraction: true
      });
    },

    setCookieTakenSurvey: function (survey) {
      GOVUK.cookie(userSurveys.cookieNameTakenSurvey(survey), true, { days: 30*4 });
      $("#user-satisfaction-survey").removeClass('visible').attr('aria-hidden', 'true');
    },

    randomNumberMatches: function(frequency) {
      return (Math.floor(Math.random() * frequency) === 0);
    },

    otherNotificationVisible: function() {
      return $('#banner-notification:visible, #global-cookie-message:visible, #global-browser-prompt:visible').length > 0;
    },
    cookieNameTakenSurvey: function(survey) {
      //user_satisfaction_survey => takenUserSatisfactionSurvey
      var cookieStr = "taken_" + survey.identifier;
      var cookieStub = cookieStr.replace(/(\_\w)/g, function(m){return m[1].toUpperCase();});
      return "govuk_" + cookieStub;
    },
    currentTime: function() { return new Date().getTime(); }
  };

  root.GOVUK.userSurveys = userSurveys;
}).call(this);

