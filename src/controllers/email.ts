import AWS from 'aws-sdk';
import nodemailer from 'nodemailer';
import moment from 'moment';
import 'moment-timezone';
import { Request, Response } from 'express';
import { email } from '../util/secrets';
import { Detail } from '../entities/Detail';

AWS.config.update({
    accessKeyId: email.AWS_ACCESS_KEY_ID,
    secretAccessKey: email.AWS_SECRET_ACCESS_KEY,
    region: email.AWS_SES_REGION,
});

const transporter = nodemailer.createTransport({
    SES: new AWS.SES({ apiVersion: '2010-12-01' }),
});

type table = 'appointment' | 'event';

const generateHtmlMsg = (type: table, events: Detail): string => {
    let output = `<h1>${events.title}</h1>`;
    output += `<div>${events.description}</div>`;
    output += '<table>';
    if (type === 'appointment') {
        output += `<caption>Time Slots for ${events.title}</caption>`;
        output += `<thead><tr>
                        <th>Day</th>
                        <th>Start</th>
                        <th>End</th>
                    </tr></thead>`;
        output += '<tbody>';
        events.slots.forEach(({ start, end }) => {
            output += `
            <tr>
                <td>${moment(start)
                    .tz('America/Chicago')
                    .format('MMM Do')}
                </td>
                <td>${moment(start)
                    .tz('America/Chicago')
                    .format('hh:mm')}
                </td>
                <td>${moment(end)
                    .tz('America/Chicago')
                    .format('hh:mm')}
                </td>
            </tr>`;
        });
        output += '</tbody>';
    }

    output += '</table>';

    return output;
};

// @TODO need to allow for 2+ attachment to be sent on a single email
export const sender = async (req: Request, res: Response) => {
    try {
        const type: table = req.body.type;
        const events: Detail = req.body.events;
        const html = generateHtmlMsg(type, events);
        const result = await transporter.sendMail({
            from: email.SOURCE_EMAIL,
            to: req.body.to,
            subject: req.body.subject,
            text: req.body.body,
            html,
            // alternatives: [
            //     {
            //         filename: req.body.filename,
            //         contentType: req.body.contentType,
            //         content: req.body.content,
            //     },
            // ],
        });
        res.send({ msg: 'Email successfully sent into the void', result });
    } catch (err) {
        res.status(403).send({ msg: `Mistakes were made ${err}` });
    }
};
