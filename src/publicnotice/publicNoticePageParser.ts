import PublicNotice from "./publicNotice";
import PageLoader from "../utils/pageLoader";
import BeautifulDom from "beautiful-dom";
import HTMLElementData from "beautiful-dom/dist/htmlelement";
import {
    NAME_LINE_REGEX,
    NAME_LINE_REGEX_GROUP,
    NOTICE_NUMBER_LINE_REGEX, NOTICE_NUMBER_LINE_REGEX_GROUP, PUBLIC_NOTICE_ARTICLE_URL_PREFIX,
    PUBLIC_NOTICE_URL
} from "./publicNoticeConstants";


class PublicNoticePageParser {

    public async readNotices() : Promise<PublicNotice[]> {
        let noticeArray : PublicNotice[] = [];

        let page : string = await PageLoader.loadPage(PUBLIC_NOTICE_URL);
        let dom : BeautifulDom = new BeautifulDom(page);
        let nextUrl : string = this.parseNextUrl(dom);

        while (nextUrl){
            let notices : PublicNotice[] = await this.parseNoticesOnPage(dom);
            noticeArray = noticeArray.concat(notices);
            page = await PageLoader.loadPage(nextUrl);
            dom = new BeautifulDom(page);
            nextUrl = this.parseNextUrl(dom);
        }

        let notices : PublicNotice[] = await this.parseNoticesOnPage(dom);
        noticeArray = noticeArray.concat(notices);

        return noticeArray;
    }

    public async parseNoticesOnPage(dom : BeautifulDom) : Promise<PublicNotice[]> {

        let noticeArray : PublicNotice[] = [];
        let articles : HTMLElementData[] = dom.getElementsByClassName('article');

        for (const article of articles){
            let name = this.parseNameLine(article);
            let noticeNumber = this.parseNoticeNumberLine(article);
            let url = this.parseUrl(article);
            let notice : PublicNotice = new PublicNotice(name, noticeNumber);
            notice.url = url;
            if (!name || !noticeNumber) {
                notice.valid = false;
            }

            noticeArray.push(notice);
        }
        return noticeArray;
    }

    private parseNameLine(element : HTMLElementData) : string {
        let name = '';
        let nameLine : HTMLElementData[] = element.getElementsByTagName('a');

        if (nameLine.length === 1) {
            let parsed : RegExpMatchArray | null = nameLine[0].innerText.match(NAME_LINE_REGEX);
            if (parsed != null) {
                name = parsed[NAME_LINE_REGEX_GROUP];
            }
        }

        return name;
    }

    private parseUrl(element : HTMLElementData) : string {
        let urlLine : HTMLElementData[] = element.getElementsByTagName('a');

        if (urlLine.length !== 1 || urlLine[0].getAttribute("href") === null) {
            return '';
        }


        return PUBLIC_NOTICE_ARTICLE_URL_PREFIX + urlLine[0].getAttribute("href");
    }

    private parseNoticeNumberLine(element : HTMLElementData) : string {
        let noticeNumber = '';
        let noticeNumberLine = element.getElementsByTagName('p');
        if (noticeNumberLine.length === 1) {
            let parsed = noticeNumberLine[0].innerText.match(NOTICE_NUMBER_LINE_REGEX);
            if (parsed != null) {
                noticeNumber = parsed[NOTICE_NUMBER_LINE_REGEX_GROUP];
            }
        }
        return noticeNumber;
    }

    private parseNextUrl(dom : BeautifulDom) : string {
        let elements : HTMLElementData[] = dom.getElementsByClassName('next');
        if (elements.length === 0){
            return '';
        }
        let urlPart : string | null = elements[0].getAttribute('href');
        if (urlPart === null) {
            return '';
        }
        let splitResult = urlPart.split("?");
        if (splitResult.length !== 2){
            return ''
        }
        return PUBLIC_NOTICE_URL + "?" + splitResult[1];
    }

}

export default new PublicNoticePageParser();