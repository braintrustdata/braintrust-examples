"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var braintrust = require("braintrust");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    // Grade and log results to BrainTrust
    function analyzeExperiment(name, prompt, dataset, responses) {
        return __awaiter(this, void 0, void 0, function () {
            var experiment, titles, i, title_1, response_1, responseCategory, expectedCategory, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, braintrust.init("classify-article-titles", {
                            experiment: name,
                        })];
                    case 1:
                        experiment = _c.sent();
                        titles = dataset.titles;
                        for (i = 0; i < titles.length; i++) {
                            title_1 = titles[i];
                            response_1 = responses[i];
                            responseCategory = (0, utils_1.getCategoryFromResponse)(response_1);
                            expectedCategory = dataset.categories[title_1.label].toLowerCase();
                            // Log to BrainTrust
                            experiment.log({
                                inputs: { title: title_1.text },
                                output: responseCategory,
                                expected: expectedCategory,
                                metadata: {
                                    "prompt": prompt,
                                },
                                scores: {
                                    "match": responseCategory == expectedCategory ? 1 : 0,
                                    "valid": dataset.categories.indexOf(responseCategory) != -1 ? 1 : 0,
                                },
                            });
                        }
                        // Log experiment summary to console (including links to the experiment in BrainTrust)
                        _b = (_a = console).log;
                        return [4 /*yield*/, experiment.summarize()];
                    case 2:
                        // Log experiment summary to console (including links to the experiment in BrainTrust)
                        _b.apply(_a, [_c.sent()]);
                        return [2 /*return*/];
                }
            });
        });
    }
    var dataset, titles, title, openai, prompt, response, responses, invalidIndex, fixedPrompt, fixedResponse, fixedResponses;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, utils_1.loadDataset)()];
            case 1:
                dataset = _a.sent();
                titles = dataset.titles;
                title = titles[0];
                openai = (0, utils_1.initializeOpenAI)();
                // Let's start with a simple example to classify one title.
                (0, utils_1.printSection)("Let's ask the model to classify our first title");
                console.log("Title: ".concat(title.text));
                console.log("Expected category: ".concat(dataset.categories[title.label]));
                prompt = "\n    You are an editor in a newspaper who helps writers identify the right category for\n    their news articles, by reading the article's title. The category should be one of\n    the following: World, Sports, Business, or Sci-Tech. Reply with one word corresponding\n    to the category";
                return [4 /*yield*/, (0, utils_1.classifyTitle)(openai, prompt, title.text)];
            case 2:
                response = _a.sent();
                console.log("Picked category: ".concat((0, utils_1.getCategoryFromResponse)(response)));
                /*
                Now, let's see evaluate our AI app performs across more examples in the dataset.
                BrainTrust makes it easy to log our evaluation results and dig into the results to fix issues.
                We'll start by defining some helper functions to make running experiments easier.
                */
                (0, utils_1.printSection)("Running experiment across the dataset");
                return [4 /*yield*/, (0, utils_1.runOnAllTitles)(openai, prompt, titles)];
            case 3:
                responses = _a.sent();
                return [4 /*yield*/, analyzeExperiment("original-prompt", prompt, dataset, responses)];
            case 4:
                _a.sent();
                console.log("Finished running experiment across the dataset");
                invalidIndex = responses.findIndex(function (response) {
                    var responseCategory = (0, utils_1.getCategoryFromResponse)(response);
                    return dataset.categories.indexOf(responseCategory) == -1;
                });
                (0, utils_1.printSection)("The following title was wrongly categorized");
                console.log("Title: ", titles[invalidIndex].text);
                console.log("Expected category: ", dataset.categories[titles[invalidIndex].label]);
                console.log("Actual category: ", (0, utils_1.getCategoryFromResponse)(responses[invalidIndex]));
                fixedPrompt = "\n      You are an editor in a newspaper who helps writers identify the right category for\n      their news articles, by reading the article's title. The category should be one of\n      the following: World, Sports, Business, or Sci/Tech. Reply with one word corresponding\n      to the category";
                (0, utils_1.printSection)("Re-running wrongly categorized title with new prompt:");
                return [4 /*yield*/, (0, utils_1.classifyTitle)(openai, fixedPrompt, titles[invalidIndex].text)];
            case 5:
                fixedResponse = _a.sent();
                console.log("Title: ", titles[invalidIndex].text);
                console.log("Expected category: ", dataset.categories[titles[invalidIndex].label]);
                console.log("Actual category: ", (0, utils_1.getCategoryFromResponse)(fixedResponse));
                /*
                The model classified the correct category Sci/Tech for this one example.
                But, how do we know it works for the rest of the dataset?
                Let's run a new experiment to evaluate our new prompt using BrainTrust.
                */
                (0, utils_1.printSection)("Re-running wrongly categorized title with new prompt:");
                return [4 /*yield*/, (0, utils_1.runOnAllTitles)(openai, fixedPrompt, titles)];
            case 6:
                fixedResponses = _a.sent();
                return [4 /*yield*/, analyzeExperiment("fixed-categories", fixedPrompt, dataset, fixedResponses)];
            case 7:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
