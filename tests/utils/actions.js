var url = 'http://localhost:3030';
module.exports = {
	createAccountAndSignin : function(client) {
		var accountRandom = new Date().getTime();
		client.url(url);
		client.waitForElementVisible('body', 1000);
		client.assert.visible('#createAccountButton');
		client.click('#createAccountButton');
		client.waitForElementVisible('.modal-dialog', 1000);
		client.assert.visible('#inputName').assert.visible("#inputMail").assert.visible("#inputPassword");
		client.setValue('#inputName', 'testAccount' + accountRandom);
		client.setValue('#inputMail', 'testAccount' + accountRandom + "@example.com");
		client.setValue('#inputPassword', accountRandom);
		client.click('#saveButton');
		client.waitForElementVisible('button[type=submit]', 1000);
		client.assert.visible('#inputMail').assert.visible("#inputMail");
		client.setValue('#inputMail', 'testAccount' + accountRandom + "@example.com");
		client.setValue('#inputPassword', accountRandom);
		client.click('#signinButton');
		client.pause(1000);
		client.assert.containsText("p", "Hi");
	},
	createContentAndCheckExists : function(client) {
		var contentRandom = new Date().getTime();
		var contentTitle = "contentTitle" + contentRandom;
		var article = "article" + contentRandom;
		client.url(url + "/editContent");
		client.click('#userNameInMenu');
		client.click('#toEditContentLink');
		client.waitForElementVisible('#contentTitle', 1000);
		client.setValue('#contentTitle', contentTitle);
		client.setValue('#article', article);
		client.click('.btn-primary');
		client.waitForElementVisible("div > div > a > span", 1000);
		client.assert.containsText("div > div > a > span", contentTitle);
		client.click("div > div > a > span");
		client.waitForElementVisible("h2", 1000);
		client.assert.containsText("h2", contentTitle);
		
	}
}