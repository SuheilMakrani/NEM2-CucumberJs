Feature: get mosaic

    Scenario Outline: getting mosaics info
        Given "<alice_publickey>" want to get a moisaic from "<nodeURL>"
        When "<alice_publickey>" prompts to get all the mosaics under her account
        Then "<alice_publickey>" should get info for all the mosaics

        Examples:
            | nodeURL                         | alice_publickey                                                 | 
            | http://catapult48gh23s.xyz:3000 | E369D06A38663FDDD56BBF22B3B9EB8E05798BCA973225CF3E5AB33085015C1F|
