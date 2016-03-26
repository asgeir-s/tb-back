import { Stream } from './typings/stream';
import * as Promise from 'bluebird'
import * as request from 'request'

const requestAsync = Promise.promisify(request)

export module StreamService {

  export function getStream(streamsServiceUrl: string, streamsServiceApiKey: string, infoLeve: string, GRID: string, streamID: string): Promise<any> {
    return requestAsync({
      method: 'POST',
      uri: streamsServiceUrl + '/streams/get',
      headers: {
        "Global-Request-ID": GRID,
        'Content-Type': 'application/json',
        "Authorization": "apikey " + streamsServiceApiKey
      },
      body: {
        "streams": [streamID],
        "infoLevel": infoLeve
      },
      json: true
    }).then((res: any) => res.body[0])
  }

  export function getAllStremsPublic(streamServiceUrl: string, streamServiceApiKey: string, GRID: string): Promise<any> {
    return requestAsync({
      method: 'GET',
      uri: streamServiceUrl + '/streams',
      headers: {
        "Global-Request-ID": GRID,
        'content-type': 'application/json',
        "Authorization": "apikey " + streamServiceApiKey
      },
      json: true
    }).then((res: any) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw new Error(res.body);
      }
      else {
        return res.body;
      }
    })
  }

}