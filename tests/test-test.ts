import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('Test the testing', () => {
	it('should run successfully', () => {
		let val = (20).toString();
		expect(val).eq("20");
	});
	it('should fail', () => {
		let val = (19).toString();
		expect(val).not.eq("20");
	});
});
