import {Connection, getConnection, Repository} from "typeorm";
import PublicNoticePageParser from "./publicNoticePageParser"
import {PublicNotice} from "../../domain/publicNotice";
import {isIn, isNotIn} from "../../utils/collectionUtils";
import {FIRST_AND_LAST_NAME_REGEX, FIRST_NAME_REGEX_GROUP, LAST_NAME_REGEX_GROUP} from "./publicNoticeConstants";

class PublicNoticeService {

    async updateAllNotices() : Promise<void> {
        let repository : Repository<PublicNotice> = getConnection().getRepository(PublicNotice);
        let fromDbNotices : PublicNotice[] = await repository.find()

        let downloadedNotices : PublicNotice[] = await PublicNoticePageParser.readNotices();
        downloadedNotices = downloadedNotices.map(n => this.fillData(n));

        let expiredNotices : PublicNotice[] = [];
        let newNotices : PublicNotice[] = [];

        for (let dbNotice of fromDbNotices){
            if (isNotIn(dbNotice, downloadedNotices)){
                dbNotice.expired = true;
                expiredNotices.push(dbNotice);
            }
        }
        for (let dwNotice of downloadedNotices){
            if (isNotIn(dwNotice, fromDbNotices)){
                newNotices.push(dwNotice);
            }
        }

        expiredNotices = await repository.save(expiredNotices)
        newNotices = await repository.save(newNotices);

        console.debug("Expired records:", expiredNotices.length);
        console.debug("New records:", newNotices.length);
    }

    private fillData(notice : PublicNotice) : PublicNotice {
        let fullName : string = notice.fullName;

        let parsedFullName : RegExpMatchArray | null = fullName.match(FIRST_AND_LAST_NAME_REGEX);

        if (parsedFullName == null || parsedFullName.length < FIRST_NAME_REGEX_GROUP){
            return notice;
        }

        notice.lastName = parsedFullName[LAST_NAME_REGEX_GROUP]
        notice.firstName = parsedFullName[FIRST_NAME_REGEX_GROUP]

        let startAnotherName : number = fullName.lastIndexOf("(");
        let endAnotherName : number = fullName.lastIndexOf(")");

        if (startAnotherName >= 0 && endAnotherName >= 0){
            let anotherName : string = fullName.substring(startAnotherName + 1, endAnotherName - 1);
            let parsedAnother : RegExpMatchArray | null = anotherName.match(FIRST_AND_LAST_NAME_REGEX);
            if (parsedAnother != null && parsedAnother.length >= FIRST_NAME_REGEX_GROUP){
                notice.otherLastName = parsedAnother[LAST_NAME_REGEX_GROUP]
                notice.otherFirstName = parsedAnother[FIRST_NAME_REGEX_GROUP]
            }
        }

        notice.lastName = notice.lastName?.toUpperCase();
        notice.firstName = notice.firstName?.toUpperCase();
        notice.otherLastName = notice.otherLastName?.toUpperCase();
        notice.otherFirstName = notice.otherFirstName?.toUpperCase();

        notice.noticeNumber = notice.noticeNumber.trim().toUpperCase();

        return notice;
    }
}

export default new PublicNoticeService();